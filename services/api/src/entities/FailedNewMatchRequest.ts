import { NewMatchRequest } from '../services/match/types'
import { jsonTransformer } from '../utils/typeorm/jsonTransformer'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({})
export class FailedNewMatchRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    matchFacrUuid: string

    @Column('varchar')
    status: FailedNewMatchRequestStatus

    @Column('longtext', { transformer: jsonTransformer('requestJson') })
    requestJson: NewMatchRequest

    @CreateDateColumn()
    createdAt?: string

    @UpdateDateColumn()
    updatedAt?: string
}

export enum FailedNewMatchRequestStatus {
    Unprocessed = 'Unprocessed',
    UnprocessedClub = 'UnprocessedClub',
    UnprocessedPlayer = 'UnprocessedPlayer',
    Processed = 'Processed',
}
