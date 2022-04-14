import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { ISO8601_NoTime } from './types'

@Entity()
@Unique('Player_Fullname_UQ_IDX', ['name', 'surname'])
export class Player {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { unique: true, nullable: true })
    facrId: string | null

    @Column()
    name: string

    @Column()
    surname: string

    @Column('varchar', { nullable: true })
    yearOfBirth: string | null

    @Column('date', { nullable: true })
    facrMemberFrom?: ISO8601_NoTime

    @Column('json', { nullable: true })
    position?: Set<PlayerPosition>
}

export enum PlayerPosition {
    Goalkeeper = 'Goalkeeper',
    Defender = 'Defender',
    Midfielder = 'Midfielder',
    Forward = 'Forward',
}
