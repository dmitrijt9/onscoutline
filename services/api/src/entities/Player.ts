import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { ISO8601 } from './types'

@Entity()
@Unique('Player_Fullname_UQ_IDX', ['name', 'surname'])
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
