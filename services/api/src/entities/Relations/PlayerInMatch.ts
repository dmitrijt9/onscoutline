import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { Match } from '../Match'
import { Player } from '../Player'

@Entity()
@Unique('PlayerPlaysMatch_UQ_IDX', ['player', 'match'])
export class PlayerInMatch {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Player, { nullable: false })
    player: Player

    @ManyToOne(() => Match, { nullable: false })
    match: Match

    /**
     * From what minute of a match player played the match.
     * If null, then player did not even go to the pitch and stayed substitute.
     */
    @Column('int', { nullable: true })
    playedFromMinute: number | null
}
