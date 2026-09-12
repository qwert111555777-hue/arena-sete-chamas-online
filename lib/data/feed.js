module.exports = {
  FEED_PESO: [
  [/[☢️]|[💥]|nuclear|míssil/i,                        'nuclear',  100],
  [/declarou GUERRA|OFENSIVA|invas/i,                   'guerra',    90],
  [/SANÇÕES|EMBARGO|BLOQUEIO/i,                         'sancao',    75],
  [/aliança|ALIANÇA|pacto|PACTO/i,                      'alianca',   70],
  [/ONU|resolução|votação/i,                            'onu',       65],
  [/Terremoto|Seca|Pandemia|Revolta|Crise financeira|Boom|furac/i, 'crise', 80],
  [/VENCEU|vitória|hegemonia/i,                         'vitoria',   95],
  [/eleição|reelei|impeachment/i,                       'politica',  60],
  [/DESCOBRIU|espionagem|sabot/i,                       'espionagem',55],
  [/conclu/i,                                           'obra',      20]
],
};
