import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { ISO8601 } from './types'

@Entity()
export class Player {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    facrId: string

    @Column()
    name: string

    @Column()
    surname: string

    @Column()
    yearOfBirth: string

    @Column('date', { nullable: true })
    facrMemberFrom?: ISO8601
}
