import { MigrationInterface, QueryRunner } from 'typeorm'

export class fixPlayerFacrMemberFrom1646913119806 implements MigrationInterface {
    name = 'fixPlayerFacrMemberFrom1646913119806'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`player\` CHANGE \`facrMemberFrom\` \`facrMemberFrom\` date NULL`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`player\` CHANGE \`facrMemberFrom\` \`facrMemberFrom\` date NOT NULL`,
        )
    }
}
