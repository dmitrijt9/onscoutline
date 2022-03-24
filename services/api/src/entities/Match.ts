import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Club } from './Club'
import { CompetitionHasSeason } from './Relations/CompetitionHasSeason'
import { ISO8601 } from './types'

@Entity()
export class Match {
    @PrimaryGeneratedColumn()
    id: number

    @Column('datetime')
    when: ISO8601

    @Column({ nullable: true })
    where?: string

    @ManyToOne(() => Club)
    homeTeam: Club

    @ManyToOne(() => Club)
    awayTeam: Club

    @Column('int')
    scoreHome: number

    @Column('int')
    scoreAway: number

    @ManyToOne(() => CompetitionHasSeason, { nullable: true })
    competitionSeason?: CompetitionHasSeason
}
