import { useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import { champion, type Tournament } from "../domain";
import { createDemoTournament } from "../demo";
import { useTournaments } from "../store";
import {
  Button,
  colors,
  dateLabel,
  Empty,
  Loading,
  runAction,
  Screen,
  styles,
} from "./ui";
import { Icon, type IconName } from "./icon";

type Filter = "all" | "draft" | "active";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Em andamento" },
  { value: "draft", label: "Inscrições abertas" },
];

function Stat({
  label,
  value,
  icon,
  detail,
}: {
  label: string;
  value: number;
  icon: IconName;
  detail: string;
}) {
  return (
    <View style={s.stat}>
      <View style={s.statTop}>
        <View style={s.iconBox}>
          <Icon name={icon} color={colors.lime} size={19} />
        </View>
        <Text style={s.statCaption}>{label}</Text>
      </View>
      <View style={s.statBottom}>
        <Text style={s.statValue}>{String(value).padStart(2, "0")}</Text>
        <Text style={s.statDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function TournamentCard({ item }: { item: Tournament }) {
  const [hovered, setHovered] = useState(false);
  const winner = champion(item);
  const played = item.matches.filter((m) => m.scoreA !== undefined).length;
  const total = Math.max(item.participants.length - 1, 0);
  const completed = total ? played / total : 0;
  const label =
    item.status === "draft"
      ? "Inscrições abertas"
      : item.status === "active"
        ? "Em andamento"
        : "Finalizado";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${item.name}`}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() =>
        router.push({ pathname: "/tournament/[id]", params: { id: item.id } })
      }
      style={({ pressed }) => [
        s.tournament,
        (hovered || pressed) && {
          borderColor: "#735041",
          backgroundColor: "#22242C",
        },
      ]}
    >
      <View style={s.cardTop}>
        <View style={s.gameBadge}>
          <Icon name="gamepad" size={20} color={colors.lime} />
        </View>
        <View
          style={[
            s.status,
            item.status === "active" && { backgroundColor: "#2D2B1F" },
            item.status === "finished" && { backgroundColor: "#203329" },
          ]}
        >
          <View
            style={[
              s.dot,
              {
                backgroundColor:
                  item.status === "finished"
                    ? "#8FCCA6"
                    : item.status === "active"
                      ? "#E7C873"
                      : "#A7ABBA",
              },
            ]}
          />
          <Text style={s.statusText}>{label}</Text>
        </View>
      </View>
      <Text style={s.game}>
        {item.game.toUpperCase()}
        {item.id.startsWith("demo-") ? "  ·  DEMONSTRAÇÃO" : ""}
      </Text>
      <Text style={s.tournamentTitle}>{item.name}</Text>
      <View style={s.meta}>
        <Icon name="calendar" size={14} />
        <Text style={s.metaText}>{dateLabel(item.startsAt)}</Text>
      </View>
      <View style={s.meta}>
        <Icon name="pin" size={14} />
        <Text style={s.metaText}>{item.location || "Local a combinar"}</Text>
      </View>
      {item.status === "draft" ? (
        <View style={s.progressArea}>
          <Text style={s.progressText}>Confirme as presenças para começar</Text>
          <View style={s.track}>
            <View
              style={[
                s.progress,
                {
                  width: `${item.participants.length ? (item.participants.filter((p) => p.checkedIn).length / item.participants.length) * 100 : 0}%`,
                },
              ]}
            />
          </View>
        </View>
      ) : (
        <View style={s.progressArea}>
          <View style={s.cardTop}>
            <Text style={s.progressText}>
              {winner ? `Campeão: ${winner.name}` : "Progresso do campeonato"}
            </Text>
            <Text style={s.progressText}>
              {played}/{total}
            </Text>
          </View>
          <View style={s.track}>
            <View style={[s.progress, { width: `${completed * 100}%` }]} />
          </View>
        </View>
      )}
      <View style={s.cardFooter}>
        <View style={s.meta}>
          <Icon name="users" size={15} />
          <Text style={s.metaText}>
            {item.participants.length} participantes
          </Text>
        </View>
        <View style={s.meta}>
          <Text style={s.openText}>Abrir arena</Text>
          <Icon name="arrowRight" color={colors.lime} size={16} />
        </View>
      </View>
    </Pressable>
  );
}

export function TournamentList({ history = false }: { history?: boolean }) {
  const { tournaments, loading, error, reload, saving, update } =
    useTournaments();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const columns = width >= 1500 ? 3 : wide ? 2 : 1;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = tournaments.filter(
    (item) =>
      (history ? item.status === "finished" : item.status !== "finished") &&
      (history || filter === "all" || item.status === filter) &&
      `${item.name} ${item.game}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const realTournaments = tournaments.filter((t) => !t.id.startsWith("demo-"));
  const active = realTournaments.filter((t) => t.status === "active").length;
  const participants = realTournaments.reduce(
    (sum, t) => sum + t.participants.length,
    0,
  );
  const matches = realTournaments.reduce(
    (sum, t) => sum + t.matches.filter((m) => m.scoreA !== undefined).length,
    0,
  );
  const date = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  async function demo() {
    await runAction(async () => {
      const existing = tournaments.find(
        (t) => t.id.startsWith("demo-") && t.status === "active",
      );
      if (existing) {
        router.push({
          pathname: "/tournament/[id]",
          params: { id: existing.id },
        });
        return;
      }
      const item = createDemoTournament(`demo-${Crypto.randomUUID()}`);
      await update((items) => [item, ...items]);
      router.push({ pathname: "/tournament/[id]", params: { id: item.id } });
    });
  }
  return (
    <Screen scroll={false}>
      <FlatList
        key={columns}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? { gap: 18 } : undefined}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.content, !wide && { padding: 20 }]}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 25, marginBottom: 19 }}>
            <View style={s.pageHeading}>
              <View>
                <Text style={s.pageTitle}>
                  {history ? "Hall da fama" : "Visão geral"}
                </Text>
                <Text style={s.pageSubtitle}>
                  {history
                    ? "As disputas acabam. As histórias ficam."
                    : "Tudo pronto para a próxima disputa?"}
                </Text>
              </View>
              {wide && (
                <View style={s.meta}>
                  <Icon name="calendar" size={15} />
                  <Text style={s.date}>{date}</Text>
                </View>
              )}
            </View>
            {!history && (
              <View style={[s.hero, !wide && { minHeight: 345 }]}>
                <Image
                  source={require("../../assets/images/arena-trophy.png")}
                  resizeMode="cover"
                  style={[
                    s.heroImage,
                    !wide && { width: "100%", opacity: 0.33 },
                  ]}
                />
                <View
                  style={[
                    s.heroContent,
                    !wide && { width: "100%", padding: 25 },
                  ]}
                >
                  <View style={s.meta}>
                    <View style={[s.dot, { backgroundColor: colors.lime }]} />
                    <Text style={s.heroEyebrow}>
                      DO PRIMEIRO CONFRONTO AO PÓDIO
                    </Text>
                  </View>
                  <Text
                    style={[
                      s.heroTitle,
                      !wide && { fontSize: 42, lineHeight: 45 },
                    ]}
                  >
                    TODO GRANDE JOGO{wide ? "\n" : " "}COMEÇA NA{" "}
                    <Text style={{ color: colors.lime }}>ARENA.</Text>
                  </Text>
                  <Text style={s.heroDescription}>
                    Reúna a galera. Monte os confrontos. Faça história.
                    {wide ? "\n" : " "}Você cuida do jogo. A gente organiza a
                    disputa.
                  </Text>
                  <View style={s.heroActions}>
                    <Button
                      title="+ Criar campeonato"
                      disabled={loading || !!error}
                      onPress={() => router.push("/create")}
                    />
                    <Pressable
                      accessibilityRole="button"
                      disabled={saving || loading || !!error}
                      onPress={() => void demo()}
                      style={s.demoButton}
                    >
                      <Icon name="gamepad" size={16} color="#E3DAD5" />
                      <Text style={s.demoText}>Explorar demonstração</Text>
                      <Icon name="arrowRight" size={15} color="#E3DAD5" />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
            <View style={{ gap: 10 }}>
              <View style={[s.stats, !wide && { gap: 9 }]}>
                <Stat
                  icon="trophy"
                  label={history ? "FINALIZADOS" : "EM ANDAMENTO"}
                  value={
                    history
                      ? realTournaments.filter((t) => t.status === "finished")
                          .length
                      : active
                  }
                  detail={history ? "campeonatos" : "torneios ativos"}
                />
                <Stat
                  icon="users"
                  label="PARTICIPANTES"
                  value={participants}
                  detail="inscrições totais"
                />
                <Stat
                  icon="swords"
                  label="PARTIDAS"
                  value={matches}
                  detail="resultados salvos"
                />
              </View>
              {tournaments.some((t) => t.id.startsWith("demo-")) && (
                <Text style={s.listSubtitle}>
                  Os indicadores consideram apenas campeonatos reais.
                  Demonstrações não entram nos totais.
                </Text>
              )}
            </View>
            <View style={[s.listHeading, !wide && { alignItems: "stretch" }]}>
              <View>
                <Text style={s.listTitle}>
                  {history ? "Quem conquistou a arena" : "Seus campeonatos"}
                </Text>
                <Text style={s.listSubtitle}>
                  {filtered.length}{" "}
                  {filtered.length === 1
                    ? "campeonato encontrado"
                    : "campeonatos encontrados"}
                </Text>
              </View>
              <View style={[s.search, !wide && { width: "100%" }]}>
                <Icon name="search" size={17} />
                <TextInput
                  accessibilityLabel="Buscar campeonatos"
                  placeholder="Buscar por nome ou modalidade"
                  placeholderTextColor="#777D8D"
                  value={search}
                  onChangeText={setSearch}
                  style={s.searchInput}
                />
              </View>
            </View>
            {!history && (
              <View style={s.filters}>
                {filters.map((item) => (
                  <Pressable
                    key={item.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: filter === item.value }}
                    onPress={() => setFilter(item.value)}
                    style={[s.filter, filter === item.value && s.filterActive]}
                  >
                    <Text
                      style={[
                        s.filterText,
                        filter === item.value && { color: colors.lime },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <Loading />
          ) : error ? (
            <Empty
              title="Seus dados estão preservados"
              message={error}
              action={
                <Button
                  title="Tentar carregar novamente"
                  onPress={() => void reload()}
                />
              }
            />
          ) : (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Icon
                  name={history ? "trophy" : "flag"}
                  color={colors.lime}
                  size={27}
                />
              </View>
              <Text style={s.emptyTitle}>
                {search || filter !== "all"
                  ? "Nenhum campeonato por aqui"
                  : history
                    ? "Seu primeiro campeão vem aí."
                    : "A próxima grande disputa é sua."}
              </Text>
              <Text style={s.emptyText}>
                {search || filter !== "all"
                  ? "Experimente outro filtro ou termo de busca."
                  : history
                    ? "Quando um campeonato terminar, o campeão ganha seu lugar aqui."
                    : "Crie seu primeiro campeonato ou explore uma demonstração\ncom oito jogadores e confrontos prontos para continuar."}
              </Text>
              {!history && !search && filter === "all" && (
                <Pressable
                  accessibilityRole="button"
                  disabled={loading || saving || !!error}
                  onPress={() => void demo()}
                  style={s.demoButton}
                >
                  <Text style={[s.demoText, { color: colors.lime }]}>
                    Conhecer a arena por dentro
                  </Text>
                  <Icon name="arrowRight" color={colors.lime} size={16} />
                </Pressable>
              )}
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 / columns, minWidth: 0 }}>
            <TournamentCard item={item} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
        ListFooterComponent={
          <View style={s.bottomNote}>
            <Icon name="shield" size={14} color="#6F7687" />
            <Text style={s.bottomText}>
              Seu campeonato, no seu dispositivo. Dados locais, sem
              sincronização entre aparelhos.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  pageHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  pageTitle: {
    color: colors.text,
    fontFamily: "Inter_600SemiBold",
    fontSize: 25,
    letterSpacing: -0.7,
  },
  pageSubtitle: {
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 7,
  },
  date: {
    color: "#9196A6",
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textTransform: "capitalize",
  },
  hero: {
    minHeight: 312,
    overflow: "hidden",
    backgroundColor: "#0B0C0E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#39322D",
  },
  heroImage: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "64%",
    height: "100%",
    opacity: 0.85,
  },
  heroContent: { width: "72%", padding: 32, gap: 18, zIndex: 1 },
  heroEyebrow: {
    color: "#D6BCAC",
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4,
  },
  heroTitle: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 60,
    lineHeight: 60,
    color: "#FAF6F3",
    letterSpacing: -0.6,
  },
  heroDescription: {
    color: "#ADA7A6",
    fontSize: 12,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
  },
  demoButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  demoText: { color: "#DBD5D1", fontSize: 11, fontFamily: "Inter_500Medium" },
  stats: { flexDirection: "row", gap: 18 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  iconBox: {
    width: 33,
    height: 33,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#332721",
  },
  statCaption: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.1,
    color: "#969DAF",
  },
  statBottom: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    flexWrap: "wrap",
  },
  statValue: {
    color: colors.text,
    fontSize: 32,
    fontFamily: "BarlowCondensed_700Bold",
  },
  statDetail: {
    fontSize: 10,
    color: "#767F93",
    fontFamily: "Inter_400Regular",
  },
  listHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "center",
    flexWrap: "wrap",
  },
  listTitle: {
    color: colors.text,
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
  },
  listSubtitle: {
    fontSize: 11,
    color: "#7B8396",
    marginTop: 7,
    fontFamily: "Inter_400Regular",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    paddingHorizontal: 13,
    height: 42,
    width: 300,
    backgroundColor: "#1A1D24",
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    minWidth: 0,
    height: "100%",
  },
  filters: {
    flexDirection: "row",
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2D36",
    paddingBottom: 13,
    flexWrap: "wrap",
  },
  filter: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 7 },
  filterActive: { backgroundColor: "#32251F" },
  filterText: { color: "#969CAB", fontSize: 11, fontFamily: "Inter_500Medium" },
  tournament: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 13,
    padding: 22,
    gap: 12,
    minHeight: 300,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  gameBadge: {
    width: 41,
    height: 41,
    borderRadius: 10,
    backgroundColor: "#332720",
    alignItems: "center",
    justifyContent: "center",
  },
  status: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: "#2C3039",
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontFamily: "Inter_500Medium", color: "#C4C7D0", fontSize: 9 },
  game: {
    fontFamily: "Inter_600SemiBold",
    color: "#838B9D",
    letterSpacing: 1.2,
    fontSize: 9,
    marginTop: 6,
  },
  tournamentTitle: {
    color: colors.text,
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    letterSpacing: -0.4,
  },
  meta: { flexDirection: "row", gap: 7, alignItems: "center" },
  metaText: {
    color: "#9BA2B2",
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    flexShrink: 1,
  },
  progressArea: { gap: 10, marginTop: 5 },
  progressText: {
    color: "#818A9D",
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#323641",
    overflow: "hidden",
  },
  progress: { height: 3, backgroundColor: colors.lime },
  cardFooter: {
    marginTop: 6,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  openText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: colors.lime,
  },
  empty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#383A45",
    borderRadius: 13,
    minHeight: 235,
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIcon: {
    backgroundColor: "#2C2421",
    borderRadius: 14,
    padding: 13,
    marginBottom: 2,
  },
  emptyTitle: {
    color: "#DDE0E8",
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    color: "#858DA0",
    fontSize: 12,
    lineHeight: 21,
    textAlign: "center",
  },
  bottomNote: {
    paddingVertical: 24,
    gap: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomText: {
    fontFamily: "Inter_400Regular",
    color: "#6D7589",
    fontSize: 10,
    flexShrink: 1,
    lineHeight: 17,
  },
});
