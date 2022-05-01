import faker from '@faker-js/faker'
import { Container } from '../../../../dependency/container/index'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../../../dependency/test-utils/index'
import { Match } from '../../../../entities/Match'
import { PlayerWithMatchInfo } from '../../../../services/match/types'
import { toOnscoutlineDateFormat } from '../../../../utils/conversions'
import { randomTestClub } from '../../../../utils/test-utils/random-club'
import { randomTestPlayer } from '../../../../utils/test-utils/random-player'

describe('Player resolver', () => {
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

    it('should return players stats correctly', async () => {
        const playerStatsRequest = `{
          player(id: "6") {
            id
            playerInfo {
              shirt
            }
            stats {
              startingEleven
              scoredGoals
              ownGoals
              penaltyGoals
              playedMatches
              goalsPerGameRatio
              yellowCards
              redCards
              hattricks
              cleanSheets
            }
          }
        }`
        await testingClient.request
            .post(`/graphql`)
            .send({ query: playerStatsRequest })
            .expect(200)
            .then((res) => {
                expect(res.body).toMatchSnapshot()
            })
    })
})
