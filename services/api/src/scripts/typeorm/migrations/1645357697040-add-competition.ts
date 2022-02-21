import { MigrationInterface, QueryRunner } from 'typeorm'

export class addCompetition1645357697040 implements MigrationInterface {
    name = 'addCompetition1645357697040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`competition\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`regionName\` varchar(255) NOT NULL, \`facrId\` varchar(255) NOT NULL, \`facrUuid\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_000730912a4f71db95a31856dd\` (\`facrId\`), UNIQUE INDEX \`IDX_1238846a10ffc667350ce51ceb\` (\`facrUuid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `CREATE TABLE \`query-result-cache\` (\`id\` int NOT NULL AUTO_INCREMENT, \`identifier\` varchar(255) NULL, \`time\` bigint NOT NULL, \`duration\` int NOT NULL, \`query\` text NOT NULL, \`result\` text NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`query-result-cache\``)
        await queryRunner.query(`DROP INDEX \`IDX_1238846a10ffc667350ce51ceb\` ON \`competition\``)
        await queryRunner.query(`DROP INDEX \`IDX_000730912a4f71db95a31856dd\` ON \`competition\``)
        await queryRunner.query(`DROP TABLE \`competition\``)
    }
}
