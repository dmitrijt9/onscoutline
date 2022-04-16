import { MigrationInterface, QueryRunner } from 'typeorm'

export class fixPlayerYearOfBirth1646912746976 implements MigrationInterface {
    name = 'fixPlayerYearOfBirth1646912746976'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`player\` CHANGE \`dateOfBirth\` \`yearOfBirth\` date NOT NULL`,
        )
        await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`yearOfBirth\``)
        await queryRunner.query(`ALTER TABLE \`player\` ADD \`yearOfBirth\` varchar(255) NOT NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`yearOfBirth\``)
        await queryRunner.query(`ALTER TABLE \`player\` ADD \`yearOfBirth\` date NOT NULL`)
        await queryRunner.query(
            `ALTER TABLE \`player\` CHANGE \`yearOfBirth\` \`dateOfBirth\` date NOT NULL`,
        )
    }
}
