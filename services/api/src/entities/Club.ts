import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Club {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    facrId: string

    @Column({ unique: true })
    name: string

    @Column()
    facrUuid: string
}
