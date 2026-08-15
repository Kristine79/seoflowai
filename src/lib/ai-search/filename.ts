const RU_TO_EN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "E", Ж: "Zh", З: "Z", И: "I",
  Й: "Y", К: "K", Л: "L", М: "M", Н: "N", О: "O", П: "P", Р: "R", С: "S", Т: "T",
  У: "U", Ф: "F", Х: "Kh", Ц: "Ts", Ч: "Ch", Ш: "Sh", Щ: "Sch", Ъ: "", Ы: "Y", Ь: "",
  Э: "E", Ю: "Yu", Я: "Ya",
};

function toLatin(value: string): string {
  return value.replace(/[а-яёА-ЯЁ]/g, (ch) => RU_TO_EN[ch] ?? "");
}

/** ASCII-безопасное имя файла отчёта: BOLID_AI_Search_Audit.pdf / .md. */
export function reportBaseName(brand: string): string {
  const part = toLatin(brand)
    .replace(/«|»|"|'|\(|\)|\[|\]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .trim();
  return `${part || "AI_Search"}_AI_Search_Audit`;
}