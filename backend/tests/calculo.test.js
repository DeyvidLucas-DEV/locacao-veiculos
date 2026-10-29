import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from './apoio.js';
import { calcularQuantidadeDiarias, calcularValorTotal } from '../src/services/locacao.service.js';

after(() => prisma.$disconnect());

test('calcula uma diária para exatamente 24 horas', () => {
  const inicio = new Date('2026-11-01T10:00:00Z');
  const devolucao = new Date('2026-11-02T10:00:00Z');

  assert.equal(calcularQuantidadeDiarias(inicio, devolucao), 1);
  assert.equal(calcularValorTotal('129.90', 1).toFixed(2), '129.90');
});

test('conta fração de 24 horas como diária completa', () => {
  const inicio = new Date('2026-11-01T10:00:00Z');

  assert.equal(calcularQuantidadeDiarias(inicio, new Date('2026-11-01T11:00:00Z')), 1);
  assert.equal(calcularQuantidadeDiarias(inicio, new Date('2026-11-02T10:01:00Z')), 2);
  assert.equal(calcularQuantidadeDiarias(inicio, new Date('2026-11-04T09:00:00Z')), 3);
});

test('calcula o valor total sem erro de ponto flutuante', () => {
  assert.equal(calcularValorTotal('0.10', 3).toFixed(2), '0.30');
  assert.equal(calcularValorTotal('129.90', 3).toFixed(2), '389.70');
});
