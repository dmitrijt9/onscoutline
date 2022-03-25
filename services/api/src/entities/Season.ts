import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class Season {
    /**
     * Name of the season should be unique by its principle
     * @example "2020/2021"
     */
    @PrimaryColumn()
    name: string

    @Column()
    year1: string

    @Column()
    year2: string
}
