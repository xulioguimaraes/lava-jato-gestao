// Converte uma string "YYYY-MM-DD" para Date em horário local, evitando o shift de fuso
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

// Formata "YYYY-MM-DD" para pt-BR sem alterar o dia
export function formatDatePtBr(dateStr: string): string {
  return parseDateOnly(dateStr).toLocaleDateString("pt-BR");
}

