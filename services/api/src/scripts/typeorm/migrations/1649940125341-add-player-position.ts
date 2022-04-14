import { MigrationInterface, QueryRunner } from 'typeorm'

export class addPlayerPosition1649940125341 implements MigrationInterface {
    name = 'addPlayerPosition1649940125341'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player\` ADD \`position\` longtext NULL`)
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
        await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`position\``)
    }
}
