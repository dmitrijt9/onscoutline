import { Club } from './Club'
import { CompetitionHasSeason } from './Relations/CompetitionHasSeason'
import { ISO8601 } from './types'
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'

@Entity()
@Unique('Match_Dedup_key', ['when', 'homeTeam', 'awayTeam', 'competitionSeason'])
export class Match {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    facrUuid: string

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
