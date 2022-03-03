import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
@Index('competition_facr_id', ['regionId', 'facrId'])
export class Competition {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
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
