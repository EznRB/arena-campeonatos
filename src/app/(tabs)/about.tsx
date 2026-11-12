import { Text } from "react-native";
import { Button, Card, Heading, Screen, styles } from "../../components/ui";
import { router } from "expo-router";

export default function About() {
  return (
    <Screen maxWidth={900}>
      <Heading
        eyebrow="MANUAL DA ARENA"
        title="Regras claras.\nDisputa boa."
        description="Uma pessoa organiza. A galera faz o campeonato acontecer."
      />
      {[
        [
          "01 · Monte o encontro",
          "Defina o nome, a modalidade, o local e o horário. Cadastre de 4 a 16 jogadores ou equipes.",
        ],
        [
          "02 · Receba os participantes",
          "Compartilhe o cartão de inscrição. No evento, leia o QR Code para confirmar a presença ou faça o check-in manual. O cartão identifica uma inscrição; não comprova identidade.",
        ],
        [
          "03 · Sorteie e entre em jogo",
          "Todos precisam ter presença confirmada. O sorteio é salvo e não muda ao reabrir. Quando necessário, alguns participantes avançam automaticamente na primeira rodada.",
        ],
        [
          "04 · Registre o resultado",
          "Informe placares inteiros de 0 a 999. Em empate, escolha quem venceu o desempate da modalidade. O vencedor avança na chave.",
        ],
        [
          "05 · Corrija com cuidado",
          "É possível corrigir um resultado enquanto nenhuma partida dependente tiver sido disputada. Depois disso, a edição é bloqueada para preservar o campeonato.",
        ],
        [
          "06 · Celebre e compartilhe",
          "A final define o campeão e o campeonato entra no histórico. Compartilhe o card do pódio com a galera.",
        ],
      ].map(([title, text]) => (
        <Card key={title}>
          <Text style={styles.heading}>{title}</Text>
          <Text style={styles.subtitle}>{text}</Text>
        </Card>
      ))}
      <Card>
        <Text style={styles.heading}>Seus dados ficam com você</Text>
        <Text style={styles.subtitle}>
          O Arena funciona no aparelho do organizador, sem conta ou servidor.
          Não sincroniza dispositivos. Desinstalar o app ou limpar seus dados
          remove os campeonatos. No navegador, os dados ficam no armazenamento
          desse navegador.
        </Text>
        <Text style={styles.small}>
          Câmera, lembretes e vibração dependem das permissões e do suporte do
          aparelho. A alternativa manual de check-in continua disponível.
        </Text>
      </Card>
      <Button
        title="Criar meu primeiro campeonato"
        onPress={() => router.push("/create")}
      />
    </Screen>
  );
}
