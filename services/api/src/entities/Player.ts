import { jsonTransformer } from '../utils/typeorm/jsonTransformer'
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
    @Column('longtext', { nullable: true, transformer: jsonTransformer('position') })
    position?: Set<PlayerPosition>

    @Column('longtext', { nullable: true, transformer: jsonTransformer('transferRecords') })
    transferRecords?: Transfer[]
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

export type Transfer = {
    when: ISO8601_NoTime
    event: string
    clubFrom: string
    clubTo: string | null
    period: {
        from: ISO8601_NoTime
        to: ISO8601_NoTime
    } | null
}
