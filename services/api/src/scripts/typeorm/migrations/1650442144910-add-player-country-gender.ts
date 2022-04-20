import { MigrationInterface, QueryRunner } from 'typeorm'

export class addPlayerCountryGender1650442144910 implements MigrationInterface {
    name = 'addPlayerCountryGender1650442144910'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player\` ADD \`gender\` varchar(255) NULL`)
        await queryRunner.query(`ALTER TABLE \`player\` ADD \`country\` varchar(255) NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`country\``)
        await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`gender\``)
    }
}
