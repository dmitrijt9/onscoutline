import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Club } from '../Club'
import { Player } from '../Player'
import { ISO8601_NoTime } from '../types'

@Entity()
export class PlayerInClub {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Player, { nullable: false, cascade: ['insert', 'update'] })
    player: Player

    @ManyToOne(() => Club, { nullable: false, cascade: ['insert', 'update'] })
    club: Club

    @Column('date', { nullable: false })
    playingFrom: ISO8601_NoTime

    @Column({ default: false })
    isOnLoan: boolean
}
