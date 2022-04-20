import { ISO8601_NoTime } from './types'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Player {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { unique: true, nullable: true })
    facrId?: string

    @Column()
    name: string

    @Column()
    surname: string

    @Column('varchar', { nullable: true })
    gender?: Gender

    @Column({ nullable: true })
    country?: string

    @Column('varchar', { nullable: true })
    dateOfBirth?: ISO8601_NoTime

    @Column('date', { nullable: true })
    facrMemberFrom?: ISO8601_NoTime

    // TODO: transform value
    @Column('json', { nullable: true })
    position?: Set<PlayerPosition>
}

export enum PlayerPosition {
    Goalkeeper = 'Goalkeeper',
    Defender = 'Defender',
    Midfielder = 'Midfielder',
    Forward = 'Forward',
}

export enum Gender {
    Male = 'Male',
    Female = 'Female',
}
