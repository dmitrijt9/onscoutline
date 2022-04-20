import { MigrationInterface, QueryRunner } from 'typeorm'

export class addPlayingUntil1650440981640 implements MigrationInterface {
    name = 'addPlayingUntil1650440981640'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`player\` CHANGE \`yearOfBirth\` \`dateOfBirth\` varchar(255) NULL`,
        )
        await queryRunner.query(`ALTER TABLE \`player_in_club\` ADD \`playingUntil\` date NULL`)
        await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`dateOfBirth\``)
        await queryRunner.query(`ALTER TABLE \`player\` ADD \`dateOfBirth\` varchar(255) NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`dateOfBirth\``)
        await queryRunner.query(`ALTER TABLE \`player\` ADD \`dateOfBirth\` varchar(255) NULL`)
        await queryRunner.query(`ALTER TABLE \`player_in_club\` DROP COLUMN \`playingUntil\``)
        await queryRunner.query(
            `ALTER TABLE \`player\` CHANGE \`dateOfBirth\` \`yearOfBirth\` varchar(255) NULL`,
        )
    }
}
