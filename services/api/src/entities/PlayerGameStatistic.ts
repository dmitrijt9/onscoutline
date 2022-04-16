import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { PlayerInMatch } from './Relations/PlayerInMatch'

@Entity()
export class PlayerGameStatistic {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column('varchar')
    statType: StatType

    @ManyToOne(() => PlayerInMatch)
    playerInMatch: PlayerInMatch

    /**
     * Value of a stat type.
     */
    @Column()
    value: number

    /**
     * Minute of a match when the stat happened.
     * In case of total played minutes in a match there is null value, because it does not have particular minute of stat happening.
     */
    @Column('int', { nullable: true })
    minute: number | null
}

export enum StatType {
    RegularGoal = 'RegularGoal',
    OwnGoal = 'OwnGoal',
    PenaltyGoal = 'PenaltyGoal',
    Assist = 'Assist',
    YellowCard = 'YellowCard',
    RedCard = 'RedCard',
    ConcededGoals = 'ConcededGoals', // specific for goalkeepers
    Substitution = 'Substitution',
}
