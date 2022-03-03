import {MigrationInterface, QueryRunner} from "typeorm";

export class addClub1645535290191 implements MigrationInterface {
    name = 'addClub1645535290191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`club\` (\`id\` int NOT NULL AUTO_INCREMENT, \`facrId\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`facrUuid\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_1c108c1e1bd440e1e2a474f72e\` (\`facrId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_1c108c1e1bd440e1e2a474f72e\` ON \`club\``);
        await queryRunner.query(`DROP TABLE \`club\``);
    }

}
