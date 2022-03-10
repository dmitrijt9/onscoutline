import { Club } from '../../entities/Club'
import { Player } from '../../entities/Player'
import { PlayerInClubRepository } from '../../repositories/PlayerInClubRepository'
import { PlayerRepository } from '../../repositories/PlayerRepository'
import { PlayerToUpdate, ScrapedPlayer } from '../scrapers/types'

export class PlayerService {
    constructor(
        private readonly playerRepository: PlayerRepository,
        private readonly playerInClubRepository: PlayerInClubRepository,
    ) {}

    async saveScrapedPlayersOfAClub(scrapedPlayers: ScrapedPlayer[], club: Club) {
        try {
            const currentPlayers = await this.playerRepository.find()

            const currentPlayersMap: Map<string, Player> = currentPlayers.reduce(
                (map: Map<string, Player>, player: Player) => {
                    map.set(player.facrId, player)
                    return map
                },
                new Map(),
            )

            const playersToInsert = scrapedPlayers.filter(
                ({ facrId }) => !currentPlayersMap.get(facrId),
            )

            const playersToUpdate: PlayerToUpdate[] = scrapedPlayers
                .filter(({ facrId }) => currentPlayersMap.get(facrId))
                .map(({ facrId, playingFrom }) => {
                    return {
                        ...(currentPlayersMap.get(facrId) as Player),
                        playingFrom,
                    }
                })

            const savedPlayers = await this.playerRepository.save(playersToInsert).finally(() => {
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
                        (a, b) =>
                            new Date(a.playingFrom).getTime() - new Date(b.playingFrom).getTime(),
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
        } catch (e) {
            console.error(e)
            throw new Error('Player Service: Could not save scraped players.')
        }
    }
}
