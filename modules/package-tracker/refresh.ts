import { rastrearEncomendas } from "correios-brasil";
import { Item, read, write } from "./utils/packages";

function parseAddress(addressOrNothing: any) {
  if (!addressOrNothing) {
    return null;
  }

  return [addressOrNothing.cidade, addressOrNothing.uf]
    .filter(Boolean)
    .join("/");
}

function parseEvent(eventOrNothing: any) {
  if (!eventOrNothing) {
    return null;
  }

  const unit1 =
    parseAddress(eventOrNothing.unidade?.endereco) ||
    eventOrNothing.unidade?.nome;

  const unit2 =
    parseAddress(eventOrNothing.unidadeDestino?.endereco) ||
    eventOrNothing.unidadeDestino?.nome;

  return {
    at: eventOrNothing.dtHrCriado,
    description: eventOrNothing.descricao,
    location: [unit1, unit2].filter(Boolean).join(" > "),
  };
}

export default function refresh() {
  return read()
    .then((packages) => {
      const packagesBycode = packages.reduce(
        (acc, it) => ({ ...acc, [it.code]: it }),
        {} as Record<string, Item>
      );

      return rastrearEncomendas(Object.keys(packagesBycode)).then((res) =>
        res.map((it: any) => ({
          ...packagesBycode[it.codObjeto],
          lastEvent: parseEvent(it.eventos?.[0] || null),
        }))
      );
    })
    .then((data) => {
      return write(data);
    });
}
