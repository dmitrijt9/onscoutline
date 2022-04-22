import { NewMatchRequest } from '../services/match/types'
import { jsonTransformer } from '../utils/typeorm/jsonTransformer'
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity({})
export class FailedNewMatchRequest {
    @PrimaryColumn()
    matchFacrUuid: string

    @PrimaryColumn('varchar')
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
