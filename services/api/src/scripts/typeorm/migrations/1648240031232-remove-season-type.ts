import { MigrationInterface, QueryRunner } from 'typeorm'

export class removeSeasonType1648240031232 implements MigrationInterface {
    name = 'removeSeasonType1648240031232'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`season\` DROP COLUMN \`year\``)
        await queryRunner.query(`ALTER TABLE \`season\` DROP COLUMN \`type\``)
        await queryRunner.query(`ALTER TABLE \`season\` ADD \`year1\` varchar(255) NOT NULL`)
        await queryRunner.query(`ALTER TABLE \`season\` ADD \`year2\` varchar(255) NOT NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`season\` DROP COLUMN \`year2\``)
        await queryRunner.query(`ALTER TABLE \`season\` DROP COLUMN \`year1\``)
        await queryRunner.query(`ALTER TABLE \`season\` ADD \`type\` varchar(255) NOT NULL`)
        await queryRunner.query(`ALTER TABLE \`season\` ADD \`year\` varchar(255) NOT NULL`)
    }
}
