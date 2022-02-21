import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Competition {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    regionName: string

    @Column({ unique: true })
    facrId: string

    @Column({ unique: true })
    facrUuid: string
}
