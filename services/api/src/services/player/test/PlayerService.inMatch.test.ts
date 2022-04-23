import faker from '@faker-js/faker'
import { Container } from '../../../dependency/container/index'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../../dependency/test-utils/index'
import { Match } from '../../../entities/Match'
import { StatType } from '../../../entities/PlayerGameStatistic'
import { toOnscoutlineDateFormat } from '../../../utils/conversions'
import { randomTestClub } from '../../../utils/test-utils/random-club'
import { randomTestPlayer } from '../../../utils/test-utils/random-player'
import { PlayerWithMatchInfo } from '../../match/types'

describe('Player service in match resolver', () => {
    let testingClient: TestingClient
    let container: Container

    let randomMatch: Match
    let randomPlayersWithmatchInfo: PlayerWithMatchInfo[]

    afterAll(async () => {
        await stopTestApplication(testingClient.application)
    })

    beforeAll(async () => {
        testingClient = await createTestingClient()
        container = testingClient.container

        await cleanDb(testingClient)
        const {
            playerRepository,
            clubRepository,
            playerInClubRepository,
            matchRepository,
            playerService,
        } = container

        const [player1, player2, player3, player4, player5, player6] = await playerRepository.save(
            [1, 2, 3, 4, 5, 6].map((t) => randomTestPlayer()),
        )

        const [randomClub1, randomClub2] = await clubRepository.save(
            [1, 2].map((t) => randomTestClub()),
        )

        await playerInClubRepository.save([
            {
                club: randomClub1,
                player: player1,
                playingFrom: toOnscoutlineDateFormat(faker.date.past(2)),
            },
            {
                club: randomClub1,
                player: player2,
                playingFrom: toOnscoutlineDateFormat(faker.date.past(2)),
            },
            {
                club: randomClub1,
                player: player3,
                playingFrom: toOnscoutlineDateFormat(faker.date.past(2)),
            },
            {
                club: randomClub2,
                player: player4,
                playingFrom: toOnscoutlineDateFormat(faker.date.past(2)),
            },
            {
                club: randomClub2,
                player: player5,
                playingFrom: toOnscoutlineDateFormat(faker.date.past(2)),
            },
            {
                club: randomClub2,
                player: player6,
                playingFrom: toOnscoutlineDateFormat(faker.date.past(2)),
            },
        ])

        randomMatch = await matchRepository.save({
            homeTeam: randomClub1,
            awayTeam: randomClub2,
            scoreAway: 2,
            scoreHome: 2,
            when: '2022-02-02T15:00:00Z',
            facrUuid: 'deiojdi',
        })

        randomPlayersWithmatchInfo = [
            {
                ...player1,
                matchInfo: {
                    fullname: `${player1.surname} ${player1.name}`,
                    goals: [{ minute: 67, type: 'Vlastní' }],
                    isInStartingLineup: true,
                    position: 'Brankář',
                    shirt: 1,
                    side: 'home',
                    substitution: '68',
                    redCardMinute: null,
                    yellowCardMinutes: null,
                },
            },
            {
                ...player2,
                matchInfo: {
                    fullname: `${player2.surname} ${player2.name}`,
                    goals: [{ minute: 2, type: 'Branka' }],
                    isInStartingLineup: true,
                    position: 'Obránce',
                    shirt: 4,
                    side: 'home',
                    substitution: '45',
                    redCardMinute: null,
                    yellowCardMinutes: null,
                },
            },
            {
                ...player3,
                matchInfo: {
                    fullname: `${player3.surname} ${player3.name}`,
                    goals: [{ minute: 46, type: 'Pokutový kop' }],
                    isInStartingLineup: false,
                    position: 'Neuvedeno',
                    shirt: 9,
                    side: 'home',
                    substitution: '45',
                    redCardMinute: null,
                    yellowCardMinutes: [67],
                },
            },
            {
                ...player4,
                matchInfo: {
                    fullname: `${player4.surname} ${player4.name}`,
                    goals: [],
                    isInStartingLineup: true,
                    position: 'Brankář',
                    shirt: 1,
                    side: 'away',
                    substitution: null,
                    redCardMinute: null,
                    yellowCardMinutes: null,
                },
            },
            {
                ...player5,
                matchInfo: {
                    fullname: `${player5.surname} ${player5.name}`,
                    goals: [],
                    isInStartingLineup: true,
                    position: 'Obránce',
                    shirt: 5,
                    side: 'away',
                    substitution: null,
                    redCardMinute: null,
                    yellowCardMinutes: null,
                },
            },
            {
                ...player6,
                matchInfo: {
                    fullname: `${player6.surname} ${player6.name}`,
                    goals: [{ minute: 90, type: 'Branka' }],
                    isInStartingLineup: true,
                    position: 'Útočník',
                    shirt: 10,
                    side: 'away',
                    substitution: null,
                    redCardMinute: null,
                    yellowCardMinutes: null,
                },
            },
        ]

        await playerService.resolvePlayersInMatch(randomPlayersWithmatchInfo, randomMatch)
    })

    it('should save player in match relation correctly', async () => {
        const { playerInMatchRepository } = container

        for (const player of randomPlayersWithmatchInfo) {
            const playerInMatchRelation = await playerInMatchRepository.findOne({
                where: {
                    player,
                    match: randomMatch,
                },
            })

            expect(playerInMatchRelation).not.toBeUndefined()
            const playedFromExpectaion = player.matchInfo.isInStartingLineup
                ? 0
                : player.matchInfo.substitution
                ? +player.matchInfo.substitution
                : null

            expect(playerInMatchRelation?.playedFromMinute).toBe(playedFromExpectaion)
        }
    })

    describe('Player in match statistics', () => {
        it('should record goals of goalscorers correctly', async () => {
            const { playerInMatchRepository, playerGameStatisticsRepository, statisticsService } =
                container

            const goalScorersWithMatchInfo = [
                randomPlayersWithmatchInfo[0],
                randomPlayersWithmatchInfo[1],
                randomPlayersWithmatchInfo[2],
            ]

            for (const player of goalScorersWithMatchInfo) {
                const playerInMatchRel = await playerInMatchRepository.findOne({
                    where: {
                        player,
                        match: randomMatch,
                    },
                })

                // I know player scored only one goal
                const playerGameGoalStat = await playerGameStatisticsRepository.findOne({
                    where: {
                        playerInMatch: playerInMatchRel,
                        statType: statisticsService.facrGoalTypeToStatType(
                            player.matchInfo.goals[0].type,
                        ),
                    },
                })

                expect(playerGameGoalStat).not.toBeUndefined()
                expect(playerGameGoalStat?.minute).toBe(player.matchInfo.goals[0].minute)
                expect(playerGameGoalStat?.value).toBe(1)
            }
        })

        it('should record yellow and red cards correctly', async () => {
            const { playerInMatchRepository, playerGameStatisticsRepository } = container

            const playerWithYellowCard = randomPlayersWithmatchInfo[2]
            const playerInMatchRel = await playerInMatchRepository.findOne({
                where: {
                    player: playerWithYellowCard,
                    match: randomMatch,
                },
            })

            const playerYellowCardStat = await playerGameStatisticsRepository.findOne({
                where: {
                    playerInMatch: playerInMatchRel,
                    statType: StatType.YellowCard,
                },
            })

            expect(playerYellowCardStat).not.toBeUndefined()
            expect(playerYellowCardStat?.minute).toBe(67)
            expect(playerYellowCardStat?.value).toBe(1)
        })

        it('should record conceded goals of a goalkeeper correctly', async () => {
            const { playerInMatchRepository, playerGameStatisticsRepository } = container

            const homeTeamGoalkeeper = randomPlayersWithmatchInfo[0]
            const awayTeamGoalkeeper = randomPlayersWithmatchInfo[3]

            const homePlInMatchRel = await playerInMatchRepository.findOne({
                where: {
                    player: homeTeamGoalkeeper,
                    match: randomMatch,
                },
            })
            const awayPlInMatchRel = await playerInMatchRepository.findOne({
                where: {
                    player: awayTeamGoalkeeper,
                    match: randomMatch,
                },
            })

            const homePlConcededGoalsStat = await playerGameStatisticsRepository.findOne({
                where: {
                    playerInMatch: homePlInMatchRel,
                    statType: StatType.ConcededGoals,
                },
            })
            const awayPlConcededGoalsStat = await playerGameStatisticsRepository.findOne({
                where: {
                    playerInMatch: awayPlInMatchRel,
                    statType: StatType.ConcededGoals,
                },
            })

            expect(homePlConcededGoalsStat).not.toBeUndefined()
            expect(awayPlConcededGoalsStat).not.toBeUndefined()

            expect(homePlConcededGoalsStat?.value).toBe(1) // last goal was scored after goalkeepers substitution off the pith
            expect(awayPlConcededGoalsStat?.value).toBe(2)
        })

        it('should record substitutions correctly', async () => {
            const { playerInMatchRepository, playerGameStatisticsRepository } = container
            const substituedPlayer = randomPlayersWithmatchInfo[0]

            const plInMatchRel = await playerInMatchRepository.findOne({
                where: {
                    player: substituedPlayer,
                    match: randomMatch,
                },
            })

            const plSubstitutionStats = await playerGameStatisticsRepository.findOne({
                where: {
                    playerInMatch: plInMatchRel,
                    statType: StatType.Substitution,
                },
            })

            expect(plSubstitutionStats).not.toBeUndefined()
            expect(plSubstitutionStats?.value).toBe(1)
            expect(plSubstitutionStats?.minute).toBe(68)
        })
    })
})
