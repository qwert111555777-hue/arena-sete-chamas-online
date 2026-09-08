import io, re
FILES = ['/home/user/presidente-online/public/index.html', '/home/user/presidente-online/server.js']
NEW = [
 ("mina_carvao","⬛ Mina de Carvão","rec",320,8,"{res:'energia',qtd:3}"),
 ("mina_cobre","🟧 Mina de Cobre","rec",340,8,"{res:'minerio',qtd:4}"),
 ("mina_bauxita","🟫 Mina de Bauxita","rec",330,8,"{res:'minerio',qtd:4}"),
 ("mina_prata","⬜ Mina de Prata","rec",480,10,"{money:14}"),
 ("mina_litio","🔋 Mina de Lítio","rec",520,10,"{res:'terras_raras',qtd:2}"),
 ("mina_niquel","🪙 Mina de Níquel","rec",350,8,"{res:'minerio',qtd:4}"),
 ("mina_zinco","⚙️ Mina de Zinco","rec",300,8,"{res:'minerio',qtd:3}"),
 ("mina_diamante","💎 Mina de Diamantes","rec",750,14,"{money:22}"),
 ("mina_estanho","🥫 Mina de Estanho","rec",280,7,"{res:'minerio',qtd:3}"),
 ("mina_manganes","⛏️ Mina de Manganês","rec",360,9,"{res:'minerio',qtd:4}"),
 ("plataforma_gas","🌊 Plataforma de Gás","rec",620,14,"{res:'energia',qtd:5}"),
 ("pedreira","🪨 Pedreira","rec",260,6,"{res:'concreto',qtd:4}"),
 ("usina_carvao","🏭 Usina a Carvão","ene",420,10,"{res:'energia',qtd:5}"),
 ("usina_geotermica","🌋 Usina Geotérmica","ene",600,12,"{res:'energia',qtd:6}"),
 ("usina_maremotriz","🌊 Usina Maremotriz","ene",580,14,"{res:'energia',qtd:5}"),
 ("usina_biomassa","🌿 Usina de Biomassa","ene",380,8,"{res:'energia',qtd:4}"),
 ("usina_ondas","🏄 Usina de Ondas","ene",450,10,"{res:'energia',qtd:4}"),
 ("reator_torio","⚛️ Reator de Tório","ene",850,20,"{res:'energia',qtd:10}"),
 ("dessalinizacao","💧 Usina de Dessalinização","ene",500,12,"{money:7}"),
 ("hidrogenio","💨 Central de Hidrogênio Verde","ene",640,12,"{res:'energia',qtd:6}"),
 ("frota_pesqueira","🎣 Frota Pesqueira","ali",420,6,"{res:'comida',qtd:5}"),
 ("aquicultura","🦐 Aquicultura","ali",350,6,"{res:'comida',qtd:4}"),
 ("trigo","🌾 Plantação de Trigo","ali",220,4,"{res:'comida',qtd:4}"),
 ("arroz","🍚 Rizicultura","ali",220,4,"{res:'comida',qtd:4}"),
 ("milho","🌽 Milharal","ali",220,4,"{res:'comida',qtd:4}"),
 ("soja","🫘 Plantação de Soja","ali",260,5,"{res:'comida',qtd:5}"),
 ("cafe","☕ Fazenda de Café","ali",380,6,"{money:12}"),
 ("cacau","🍫 Fazenda de Cacau","ali",360,6,"{money:10}"),
 ("citricos","🍊 Pomar de Cítricos","ali",240,4,"{res:'comida',qtd:3}"),
 ("vinicola","🍷 Vinícola","ali",460,8,"{money:14}"),
 ("cervejaria","🍺 Cervejaria","ali",440,8,"{money:13}"),
 ("laticinios","🧀 Laticínios","ali",400,8,"{res:'comida',qtd:5}"),
 ("frigorifico","🥩 Frigorífico","ali",480,10,"{res:'comida',qtd:6}"),
 ("oleo_vegetal","🫗 Fábrica de Óleo Vegetal","ali",340,7,"{res:'comida',qtd:4}"),
 ("refinaria","🛢️ Refinaria","ind",600,14,"{res:'energia',qtd:4}"),
 ("petroquimica","⚗️ Petroquímica","ind",680,14,"{money:16}"),
 ("plastico","🧴 Fábrica de Plástico","ind",380,8,"{money:10}"),
 ("vidro","🪟 Fábrica de Vidro","ind",360,8,"{money:9}"),
 ("papel","📄 Fábrica de Papel","ind",300,6,"{money:8}"),
 ("cimento","🏗️ Fábrica de Cimento","ind",420,10,"{res:'concreto',qtd:5}"),
 ("tecelagem","🧵 Tecelagem","ind",320,6,"{money:9}"),
 ("couro","👜 Curtume de Couro","ind",330,7,"{money:9}"),
 ("moveis","🪑 Fábrica de Móveis","ind",390,8,"{money:11}"),
 ("eletronicos","📺 Fábrica de Eletrônicos","ind",620,12,"{money:15}"),
 ("semicondutores","💾 Fábrica de Semicondutores","ind",880,18,"{money:20}"),
 ("montadora","🚗 Montadora","ind",760,16,"{money:18}"),
 ("caminhoes","🚚 Fábrica de Caminhões","ind",640,14,"{money:15}"),
 ("aeronaves","🛩️ Fábrica de Aeronaves","ind",820,16,"{money:19}"),
 ("fertilizantes","🧪 Fábrica de Fertilizantes","ind",400,8,"{res:'comida',qtd:3}"),
 ("farmaceutica","💊 Indústria Farmacêutica","ind",700,14,"{money:17}"),
 ("quimica","🧫 Indústria Química","ind",560,12,"{money:13}"),
 ("baterias","🔋 Fábrica de Baterias","ind",480,10,"{money:12}"),
 ("paineis_solares","🔆 Fábrica de Painéis Solares","ind",520,10,"{res:'energia',qtd:2}"),
 ("base_aerea","🛫 Base Aérea","mil",600,12,"{}"),
 ("base_naval","⚓ Base Naval","mil",650,14,"{}"),
 ("academia_militar","🎓 Academia Militar","mil",450,10,"{}"),
 ("inteligencia","🕵️ Agência de Inteligência","mil",550,10,"{}"),
 ("drones","🛸 Fábrica de Drones","mil",620,12,"{}"),
 ("silo_misseis","🚀 Silo de Mísseis","mil",800,18,"{}"),
 ("antimisseis","🛡️ Defesa Antimísseis","mil",750,16,"{}"),
 ("radar","📡 Estação de Radar","mil",480,10,"{}"),
 ("hospital_militar","🏥 Hospital Militar","mil",420,10,"{}"),
 ("centro_logistico","🚛 Centro Logístico","mil",380,8,"{}"),
 ("escola","🏫 Escola","inf",250,6,"{money:4}"),
 ("universidade","🎓 Universidade","inf",520,10,"{money:9}"),
 ("instituto_tecnico","🔧 Instituto Técnico","inf",350,8,"{money:6}"),
 ("hospital","🏥 Hospital","inf",480,10,"{money:5}"),
 ("clinica","🩺 Clínica","inf",300,7,"{money:5}"),
 ("habitacao","🏘️ Conjunto Habitacional","inf",420,9,"{money:7}"),
 ("saneamento","🚰 Saneamento Básico","inf",330,8,"{money:4}"),
 ("rede_agua","💧 Rede de Água","inf",280,6,"{money:4}"),
 ("reciclagem","♻️ Usina de Reciclagem","inf",360,8,"{res:'minerio',qtd:2}"),
 ("aterro","🗑️ Aterro Sanitário","inf",200,5,"{money:3}"),
 ("incineradora","🔥 Incineradora","inf",420,10,"{res:'energia',qtd:2}"),
 ("barragem","🌊 Barragem","inf",600,14,"{res:'energia',qtd:4}"),
 ("canal","🚣 Canal","inf",380,8,"{money:4}"),
 ("ponte","🌉 Ponte","inf",450,10,"{money:6}"),
 ("tunel","🚇 Túnel","inf",520,12,"{money:6}"),
 ("data_center","🖥️ Data Center","inf",660,12,"{money:13}"),
 ("telecom","📶 Torre de Telecom","inf",400,8,"{money:8}"),
 ("banco","🏦 Banco","inf",700,12,"{money:16}"),
 ("bolsa_valores","📈 Bolsa de Valores","inf",850,14,"{money:22}"),
 ("estadio","🏟️ Estádio","inf",550,12,"{money:10}"),
 ("teatro","🎭 Teatro","inf",320,7,"{money:6}"),
 ("museu","🖼️ Museu","inf",300,7,"{money:5}"),
 ("biblioteca","📚 Biblioteca","inf",220,5,"{money:3}"),
 ("parque","🌳 Parque","inf",180,4,"{money:3}"),
 ("hotel","🏨 Hotel","inf",500,10,"{money:11}"),
 ("shopping","🛍️ Shopping","inf",620,12,"{money:14}"),
 ("zona_franca","🏷️ Zona Franca","inf",580,12,"{money:15}"),
 ("porto_seco","🚂 Porto Seco","inf",420,9,"{money:9}"),
 ("observatorio","🔭 Observatório","inf",350,8,"{money:4}"),
 ("porto_espacial","🚀 Porto Espacial","inf",950,22,"{money:25}"),
]
assert len(NEW)==93, len(NEW)
TABLES = ["PROD_BUILDS","CONCRETE_NEED","PROD_NAMES","BUILD_TAB","BUILD_OUT"]
def entry(tb,e):
    i,n,t,c,cc,o=e
    return {"PROD_BUILDS":f"{i}:{c}","CONCRETE_NEED":f"{i}:{cc}","PROD_NAMES":f"{i}:'{n}'","BUILD_TAB":f"{i}:'{t}'","BUILD_OUT":f"{i}:{o}"}[tb]
def getline(t,tb):
    ls=[l for l in t.split('\n') if l.startswith('const '+tb+' = {')]
    assert len(ls)==1, f"{tb}: {len(ls)} linhas!"
    assert ls[0].rstrip().endswith('};'), f"{tb}: fim inesperado!"
    return ls[0]
texts=[io.open(f,encoding='utf-8').read() for f in FILES]
for tb in TABLES:
    a,b=getline(texts[0],tb),getline(texts[1],tb)
    assert a==b, f"{tb} difere entre client e server!"
    for e in NEW:
        assert not re.search(r'[{,]'+re.escape(e[0])+r':',a), f"colisao: {e[0]}"
print("PRE-CHECK OK: client==server, 0 colisoes, 93 novos")
for x,f in enumerate(FILES):
    t=texts[x]
    for tb in TABLES:
        old=getline(t,tb)
        add=","+",".join(entry(tb,e) for e in NEW)
        new=old.rstrip()[:-2]+add+"};"
        assert t.count(old)==1
        t=t.replace(old,new)
    io.open(f,'w',encoding='utf-8').write(t)
    print("PATCH OK:",f)
