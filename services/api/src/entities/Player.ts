import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Player {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    surname: string

    @Column('date')
    dateOfBirth: string

    @Column('date')
    facrMemberFrom: string
}
