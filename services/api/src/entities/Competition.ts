import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm'

@Entity()
@Unique('Competition_UQ_IDX', ['regionId', 'facrId'])
export class Competition {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    name: string

    @Column()
    regionId: string

    @Column()
    regionName: string

    @Column()
    facrId: string

    @Column()
    facrUuid: string
}
