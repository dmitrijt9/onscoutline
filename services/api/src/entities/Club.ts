import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Club {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { unique: true })
    facrId: string

    @Column()
    name: string

    @Column('varchar', { nullable: true })
    facrUuid?: string
}
