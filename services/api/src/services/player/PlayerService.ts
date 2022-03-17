import { Club } from '../../entities/Club'
import { Player } from '../../entities/Player'
import { ClubRepository } from '../../repositories/club/ClubRepository'
import { PlayerInClubRepository } from '../../repositories/player/PlayerInClubRepository'
import { PlayerRepository } from '../../repositories/player/PlayerRepository'
import { PlayerToUpdate } from '../scrapers/types'
import { NewPlayerClubNotFound } from './errors'
import { NewPlayerRequest } from './types'

export class PlayerService {
    constructor(
        private readonly playerRepository: PlayerRepository,
        private readonly playerInClubRepository: PlayerInClubRepository,
        private readonly clubRepository: ClubRepository,
    ) {}

    async processNewPlayersOfClub(
        newPlayers: NewPlayerRequest[],
        clubFacrId: Club['facrId'],
    ): Promise<Player[]> {
        const club = await this.clubRepository.findByFacrId(clubFacrId)

        if (!club) {
            throw new NewPlayerClubNotFound(clubFacrId)
        }

        const currentPlayers = await this.playerRepository.find()
        const currentPlayersMap: Map<string, Player> = currentPlayers.reduce(
            (map: Map<string, Player>, player: Player) => {
                map.set(player.facrId, player)
                return map
            },
            new Map(),
        )

        const playersToInsert = newPlayers.filter(({ facrId }) => !currentPlayersMap.get(facrId))

        const playersToUpdate: PlayerToUpdate[] = newPlayers
            .filter(({ facrId }) => currentPlayersMap.get(facrId))
            .map(({ facrId, playingFrom }) => {
                return {
                    ...(currentPlayersMap.get(facrId) as Player),
                    playingFrom,
                }
            })

        const savedPlayers: Player[] = await this.playerRepository
            .save(playersToInsert)
            .finally(() => {
                console.log(
                    `Player Service: Successfully saved ${playersToInsert.length} new players.`,
                )
            })

        await this.playerInClubRepository.save(
            savedPlayers.map((player) => {
                return {
                    player: {
                        id: player.id,
                    },
                    club: {
                        id: club.id,
                    },
                    playingFrom: playersToInsert.find((p) => p.facrId === player.facrId)
                        ?.playingFrom,
                }
            }),
        )

        // check for existing players club changes
        for (const player of playersToUpdate) {
            const relations = await this.playerInClubRepository.find({
                where: {
                    club: {
                        id: club.id,
                    },
                    player: {
                        id: player.id,
                    },
                },
            })

            if (!relations.length) {
                await this.playerInClubRepository.save({
                    player: {
                        id: player.id,
                    },
                    club: {
                        id: club.id,
                    },
                    playingFrom: player.playingFrom,
                })
            } else {
                const sortedRalations = relations.sort(
                    (a, b) => new Date(a.playingFrom).getTime() - new Date(b.playingFrom).getTime(),
                )
                if (sortedRalations[0].playingFrom < player.playingFrom) {
                    await this.playerInClubRepository.save({
                        player: {
                            id: player.id,
                        },
                        club: {
                            id: club.id,
                        },
                        playingFrom: player.playingFrom,
                    })
                }
            }
        }

        return savedPlayers
    }
}
