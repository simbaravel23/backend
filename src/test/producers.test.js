// src/tests/producers.test.js
const request = require('supertest');
const app = require('../app'); // O app Express
const { db } = require('../config/database'); // Para limpar e popular o DB nos testes
const { loadMoviesFromCsv } = require('../services/dataService');
const path = require('path');
const fs = require('fs');

const TEST_CSV_PATH = path.join(__dirname, '../../data/test_movielist.csv'); // Use um CSV de teste

// Crie um CSV de teste temporário para cada execução de teste se necessário
const createTestCsv = () => {
    const csvContent = `year,title,studios,producers,winner
1980,Can't Stop the Music,Associated Film Distribution,Allan Carr,true
1981,The Jazz Singer,EMI Films,Neil Diamond,true
1985,Rambo: First Blood Part II,TriStar Pictures,Buzz Feitshans,true
1986,Howard the Duck,Universal Pictures,Gloria Katz,true
1990,Ghost Dad,Universal Pictures,Hilton A. Green,true
1992,Shining Through,20th Century Fox,Howard Rosenman,true
2000,Battlefield Earth,Warner Bros.,Jonathan Krane,true
2001,Freddy Got Fingered,20th Century Fox,Larry Jones,true
2002,Swept Away,Screen Gems,Guy Ritchie,true
2005,Son of the Mask,New Line Cinema,Guy Ritchie,true
2010,The Last Airbender,Paramount Pictures,M. Night Shyamalan,true
2015,Jupiter Ascending,Warner Bros.,Andy Wachowski,true
`;
    fs.writeFileSync(TEST_CSV_PATH, csvContent);
};

// Funções auxiliares para mockar o dataService para os testes
jest.mock('../services/dataService', () => ({
    loadMoviesFromCsv: jest.fn(), // Mocka a função para não carregar CSV real durante testes
}));

// Mock do banco de dados para os testes (opcional, se quiser testar a lógica sem o DB real)
// Mas para testes de integração, geralmente se usa o DB real ou uma instância separada.
// Aqui, vamos usar a instância em memória, mas controlando os dados.

describe('Producers API', () => {
    beforeAll(async () => {
        // Crie o CSV de teste antes de rodar os testes
        createTestCsv();

        // Popular o banco de dados com dados de teste para garantir consistência
        await db.remove({}, { multi: true }); // Limpar o banco de dados
        await new Promise((resolve, reject) => {
            fs.createReadStream(TEST_CSV_PATH)
                .pipe(parse({
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    cast: (value, context) => {
                        if (context.column === 'year') return parseInt(value, 10);
                        if (context.column === 'winner') return value.toLowerCase() === 'true';
                        if (context.column === 'studios' || context.column === 'producers') {
                            return value.split(',').map(item => item.trim());
                        }
                        return value;
                    }
                }))
                .on('data', (row) => { db.insert(row); })
                .on('end', resolve)
                .on('error', reject);
        });
    }, 10000); // Aumentar timeout para beforeAll

    afterAll(() => {
        // Limpar o CSV de teste e o banco de dados após todos os testes
        fs.unlinkSync(TEST_CSV_PATH);
        db.remove({}, { multi: true });
    });

    it('should return producers with min and max win intervals', async () => {
        const res = await request(app).get('/api/producers/interval-of-wins');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('min');
        expect(res.body).toHaveProperty('max');

        // Testar os valores esperados com base no CSV de teste
        // Produtor com menor intervalo
        expect(res.body.min).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    producer: 'Guy Ritchie',
                    interval: 3,
                    previousWin: 2002,
                    followingWin: 2005
                })
            ])
        );

        // Produtor com maior intervalo (exemplo com o CSV fornecido)
        expect(res.body.max).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    producer: 'Jonathan Krane',
                    interval: 10, // 2010 (Last Airbender) - 2000 (Battlefield Earth) = 10 (se ele estiver em ambos os filmes)
                    previousWin: 2000,
                    followingWin: 2010
                }),
                expect.objectContaining({
                    producer: 'Howard Rosenman',
                    interval: 12, // 2000 (Battlefield Earth) - 1992 (Shining Through) = 8
                    previousWin: 1992,
                    followingWin: 2000
                })
            ])
        );

        // Ajuste os valores esperados de acordo com os dados reais do seu CSV de teste!
        // Os exemplos acima são baseados em um CSV com produtores fictícios e anos específicos para demonstrar.
    });

    it('should handle cases with no winners or insufficient data', async () => {
        // Limpar o DB e inserir dados que não geram intervalos (e.g., nenhum vencedor)
        await db.remove({}, { multi: true });
        db.insert([
            { year: 1990, title: 'Movie X', producers: ['Prod Z'], winner: false },
            { year: 2000, title: 'Movie Y', producers: ['Prod W'], winner: true } // Apenas uma vitória
        ]);

        const res = await request(app).get('/api/producers/interval-of-wins');
        expect(res.statusCode).toEqual(200);
        expect(res.body.min).toEqual([]);
        expect(res.body.max).toEqual([]);
    });
});