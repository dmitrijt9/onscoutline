import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { Competition } from '../Competition'
import { Season } from '../Season'

@Entity()
@Unique('CompetitionHasSeason_UQ_IDX', ['competition', 'season'])
export class CompetitionHasSeason {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Competition)
    competition: Competition

    @ManyToOne(() => Season)
    season: Season
}
