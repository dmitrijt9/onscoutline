import { MigrationInterface, QueryRunner } from 'typeorm'

export class updatePlayerNullable1649000077201 implements MigrationInterface {
    name = 'updatePlayerNullable1649000077201'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`player\` CHANGE \`facrId\` \`facrId\` varchar(255) NULL`,
        )
        await queryRunner.query(
            `ALTER TABLE \`player\` CHANGE \`yearOfBirth\` \`yearOfBirth\` varchar(255) NULL`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`player\` CHANGE \`yearOfBirth\` \`yearOfBirth\` varchar(255) NOT NULL`,
        )
        await queryRunner.query(
            `ALTER TABLE \`player\` CHANGE \`facrId\` \`facrId\` varchar(255) NOT NULL`,
        )
    }
}
