import { MigrationInterface, QueryRunner } from 'typeorm'

export class addPlayerShirtPositions1650620674939 implements MigrationInterface {
    name = 'addPlayerShirtPositions1650620674939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`position\``)
        await queryRunner.query(`ALTER TABLE \`player\` ADD \`shirtNumber\` int NULL`)
        await queryRunner.query(`ALTER TABLE \`player\` ADD \`positions\` longtext NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`positions\``)
        await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`shirtNumber\``)
        await queryRunner.query(`ALTER TABLE \`player\` ADD \`position\` longtext NULL`)
    }
}
