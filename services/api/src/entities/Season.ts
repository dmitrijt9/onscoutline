import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class Season {
    /**
     * Name of the season should be unique by its principle
     */
    @PrimaryColumn()
    name: string

    @Column()
    year: string

    @Column('varchar')
    type: SeasonType
}

export enum SeasonType {
    Spring = 'Spring',
    Autumn = 'Autumn',
}
