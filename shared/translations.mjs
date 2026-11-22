import { languages, getLanguage } from './languages.mjs'
import { secondaryRows } from './secondary-messages.mjs'

// Columns follow languages: English, Hindi, Spanish, French, German,
// Portuguese, Arabic, Japanese, Korean, Simplified Chinese.
const rows = `
Website language¦वेबसाइट की भाषा¦Idioma del sitio¦Langue du site¦Websitesprache¦Idioma do site¦لغة الموقع¦サイトの言語¦사이트 언어¦网站语言
Explore¦खोजें¦Explorar¦Explorer¦Entdecken¦Explorar¦استكشف¦見つける¦둘러보기¦探索
Search¦खोज¦Buscar¦Rechercher¦Suchen¦Buscar¦بحث¦検索¦검색¦搜索
Where to watch¦कहाँ देखें¦Dónde ver¦Où regarder¦Wo ansehen¦Onde assistir¦أين تشاهد¦視聴方法¦시청 방법¦观看平台
Calendar¦कैलेंडर¦Calendario¦Calendrier¦Kalender¦Calendário¦التقويم¦カレンダー¦달력¦日历
Release calendar¦रिलीज़ कैलेंडर¦Calendario de estrenos¦Calendrier des sorties¦Veröffentlichungskalender¦Calendário de lançamentos¦تقويم الإصدارات¦公開カレンダー¦공개 일정¦上映日历
Find movies & series¦फ़िल्में और सीरीज़ खोजें¦Buscar películas y series¦Trouver des films et séries¦Filme und Serien finden¦Encontrar filmes e séries¦ابحث عن الأفلام والمسلسلات¦映画・ドラマを探す¦영화와 시리즈 찾기¦查找电影和剧集
Trending¦लोकप्रिय¦Tendencias¦Tendances¦Im Trend¦Em alta¦الرائج¦トレンド¦인기작¦热门
All¦सभी¦Todo¦Tout¦Alle¦Tudo¦الكل¦すべて¦전체¦全部
Movies¦फ़िल्में¦Películas¦Films¦Filme¦Filmes¦أفلام¦映画¦영화¦电影
Series¦सीरीज़¦Series¦Séries¦Serien¦Séries¦مسلسلات¦ドラマ¦시리즈¦剧集
Movie¦फ़िल्म¦Película¦Film¦Film¦Filme¦فيلم¦映画¦영화¦电影
Title type¦शीर्षक का प्रकार¦Tipo de título¦Type de titre¦Titelart¦Tipo de título¦نوع العمل¦作品の種類¦작품 유형¦作品类型
Title¦शीर्षक¦Título¦Titre¦Titel¦Título¦العنوان¦タイトル¦제목¦片名
Reference title¦पसंदीदा फ़िल्म या सीरीज़¦Título de referencia¦Titre de référence¦Referenztitel¦Título de referência¦العمل المرجعي¦参考作品¦기준 작품¦参考作品
By mood¦मूड के अनुसार¦Por ánimo¦Par humeur¦Nach Stimmung¦Por humor¦حسب المزاج¦気分で探す¦기분별¦按心情
Describe a title¦विवरण से खोजें¦Describir un título¦Décrire un titre¦Titel beschreiben¦Descrever um título¦صف ما تريد مشاهدته¦内容で探す¦설명으로 찾기¦描述作品
Similar to…¦इससे मिलता-जुलता…¦Similar a…¦Similaire à…¦Ähnlich wie…¦Semelhante a…¦مشابه لـ…¦似た作品…¦비슷한 작품…¦相似作品…
Find titles¦खोजें¦Buscar títulos¦Trouver des titres¦Titel finden¦Encontrar títulos¦ابحث عن أعمال¦作品を探す¦작품 찾기¦查找作品
Searching…¦खोज रहे हैं…¦Buscando…¦Recherche…¦Suche läuft…¦Buscando…¦جارٍ البحث…¦検索中…¦검색 중…¦正在搜索…
Finding titles…¦शीर्षक खोज रहे हैं…¦Buscando títulos…¦Recherche de titres…¦Titel werden gesucht…¦Buscando títulos…¦جارٍ البحث عن أعمال…¦作品を検索中…¦작품을 찾는 중…¦正在查找作品…
Searching titles…¦शीर्षक खोज रहे हैं…¦Buscando títulos…¦Recherche de titres…¦Titel werden gesucht…¦Buscando títulos…¦جارٍ البحث عن أعمال…¦作品を検索中…¦작품 검색 중…¦正在搜索作品…
Show more titles¦और नतीजे दिखाएँ¦Mostrar más títulos¦Voir plus de titres¦Weitere Titel anzeigen¦Mostrar mais títulos¦عرض المزيد من الأعمال¦もっと見る¦작품 더 보기¦显示更多作品
Loading more…¦और नतीजे लोड हो रहे हैं…¦Cargando más…¦Chargement…¦Weitere werden geladen…¦Carregando mais…¦جارٍ تحميل المزيد…¦読み込み中…¦더 불러오는 중…¦正在加载更多…
Loading titles…¦शीर्षक लोड हो रहे हैं…¦Cargando títulos…¦Chargement des titres…¦Titel werden geladen…¦Carregando títulos…¦جارٍ تحميل الأعمال…¦作品を読み込み中…¦작품 불러오는 중…¦正在加载作品…
Retry¦फिर कोशिश करें¦Reintentar¦Réessayer¦Erneut versuchen¦Tentar novamente¦حاول مجددًا¦再試行¦다시 시도¦重试
Retry search¦फिर खोजें¦Reintentar búsqueda¦Relancer la recherche¦Suche wiederholen¦Repetir busca¦أعد البحث¦もう一度検索¦다시 검색¦重新搜索
Back to discovery¦खोज पर वापस जाएँ¦Volver a explorar¦Retour à la découverte¦Zurück zur Übersicht¦Voltar a explorar¦العودة إلى الاستكشاف¦作品一覧に戻る¦둘러보기로 돌아가기¦返回探索
Back to results¦नतीजों पर वापस जाएँ¦Volver a resultados¦Retour aux résultats¦Zurück zu Ergebnissen¦Voltar aos resultados¦العودة إلى النتائج¦検索結果に戻る¦결과로 돌아가기¦返回结果
Quick preview¦झलक देखें¦Vista previa¦Aperçu¦Vorschau¦Prévia¦معاينة سريعة¦プレビュー¦미리 보기¦快速预览
Explore this title¦पूरी जानकारी देखें¦Ver este título¦Découvrir ce titre¦Diesen Titel entdecken¦Ver este título¦استكشف هذا العمل¦作品の詳細を見る¦작품 자세히 보기¦查看作品详情
Explore this film¦फ़िल्म की जानकारी देखें¦Ver esta película¦Découvrir ce film¦Diesen Film entdecken¦Ver este filme¦استكشف هذا الفيلم¦映画の詳細を見る¦영화 자세히 보기¦查看电影详情
About this title¦इस शीर्षक के बारे में¦Sobre este título¦À propos de ce titre¦Über diesen Titel¦Sobre este título¦عن هذا العمل¦作品について¦작품 소개¦作品简介
Created by¦निर्माता¦Creada por¦Création¦Schöpfer¦Criação¦إبداع¦原案・制作¦제작자¦主创
Directed by¦निर्देशन¦Dirigida por¦Réalisation¦Regie¦Direção¦إخراج¦監督¦감독¦导演
Director¦निर्देशक¦Director¦Réalisation¦Regie¦Diretor¦المخرج¦監督¦감독¦导演
Director / creator¦निर्देशक / निर्माता¦Director / creador¦Réalisation / création¦Regie / Schöpfer¦Diretor / criador¦المخرج / المبدع¦監督・制作者¦감독 / 제작자¦导演 / 主创
Runtime¦अवधि¦Duración¦Durée¦Laufzeit¦Duração¦المدة¦上映時間¦상영 시간¦时长
Episode runtime¦एपिसोड की अवधि¦Duración por episodio¦Durée par épisode¦Episodenlänge¦Duração do episódio¦مدة الحلقة¦1話の長さ¦에피소드 길이¦单集时长
Original language¦मूल भाषा¦Idioma original¦Langue originale¦Originalsprache¦Idioma original¦اللغة الأصلية¦原語¦원어¦原始语言
Not recorded¦दर्ज नहीं है¦Sin datos¦Non renseigné¦Nicht erfasst¦Não informado¦غير مسجل¦情報なし¦정보 없음¦暂无记录
Unknown¦अज्ञात¦Desconocido¦Inconnu¦Unbekannt¦Desconhecido¦غير معروف¦不明¦알 수 없음¦未知
First aired¦पहला प्रसारण¦Primer estreno¦Première diffusion¦Erstausstrahlung¦Primeira exibição¦العرض الأول¦初回放送¦첫 방영일¦首播日期
First recorded release¦पहली दर्ज रिलीज़¦Primer estreno registrado¦Première sortie enregistrée¦Erste erfasste Veröffentlichung¦Primeiro lançamento registrado¦أول إصدار مسجل¦最初の公開¦최초 공개 기록¦首次上映记录
Seasons / episodes¦सीज़न / एपिसोड¦Temporadas / episodios¦Saisons / épisodes¦Staffeln / Episoden¦Temporadas / episódios¦المواسم / الحلقات¦シーズン・話数¦시즌 / 에피소드¦季数 / 集数
Seasons¦सीज़न¦Temporadas¦Saisons¦Staffeln¦Temporadas¦المواسم¦シーズン¦시즌¦季
Seasons & specials¦सीज़न और विशेष एपिसोड¦Temporadas y especiales¦Saisons et épisodes spéciaux¦Staffeln und Specials¦Temporadas e especiais¦المواسم والحلقات الخاصة¦シーズン・特別編¦시즌 및 스페셜¦季与特别篇
Cast¦कलाकार¦Reparto¦Distribution¦Besetzung¦Elenco¦طاقم التمثيل¦キャスト¦출연진¦演员
Status¦स्थिति¦Estado¦Statut¦Status¦Status¦الحالة¦状態¦상태¦状态
Returning Series¦आगे जारी है¦En emisión¦En cours¦Wird fortgesetzt¦Em andamento¦مستمر¦継続中¦방영 중¦连载中
Ended¦समाप्त¦Finalizada¦Terminée¦Abgeschlossen¦Encerrada¦انتهى¦終了¦종영¦已完结
Canceled¦रद्द¦Cancelada¦Annulée¦Abgesetzt¦Cancelada¦ملغى¦打ち切り¦취소됨¦已取消
In Production¦निर्माण में¦En producción¦En production¦In Produktion¦Em produção¦قيد الإنتاج¦制作中¦제작 중¦制作中
Planned¦योजना में¦Planeada¦Prévue¦Geplant¦Planejada¦مخطط له¦企画中¦예정¦计划中
Pilot¦पायलट¦Piloto¦Pilote¦Pilotfolge¦Piloto¦حلقة تجريبية¦パイロット版¦파일럿¦试播集
Watch trailer¦ट्रेलर देखें¦Ver tráiler¦Voir la bande-annonce¦Trailer ansehen¦Ver trailer¦شاهد الإعلان¦予告編を見る¦예고편 보기¦观看预告
Search for trailers¦ट्रेलर खोजें¦Buscar tráilers¦Chercher des bandes-annonces¦Trailer suchen¦Buscar trailers¦ابحث عن إعلانات¦予告編を探す¦예고편 검색¦搜索预告
Share series¦सीरीज़ साझा करें¦Compartir serie¦Partager la série¦Serie teilen¦Compartilhar série¦مشاركة المسلسل¦ドラマを共有¦시리즈 공유¦分享剧集
Share film¦फ़िल्म साझा करें¦Compartir película¦Partager le film¦Film teilen¦Compartilhar filme¦مشاركة الفيلم¦映画を共有¦영화 공유¦分享电影
Link copied¦लिंक कॉपी हो गया¦Enlace copiado¦Lien copié¦Link kopiert¦Link copiado¦تم نسخ الرابط¦リンクをコピーしました¦링크 복사됨¦链接已复制
Find something with a similar feeling¦इसी तरह के और शीर्षक खोजें¦Buscar algo con un estilo similar¦Trouver une ambiance similaire¦Ähnliche Titel finden¦Encontrar algo parecido¦ابحث عن أعمال بأجواء مشابهة¦似た雰囲気の作品を探す¦비슷한 분위기의 작품 찾기¦查找相似风格作品
Country¦देश¦País¦Pays¦Land¦País¦البلد¦国・地域¦국가¦国家或地区
Loading countries…¦देश लोड हो रहे हैं…¦Cargando países…¦Chargement des pays…¦Länder werden geladen…¦Carregando países…¦جارٍ تحميل البلدان…¦国を読み込み中…¦국가 불러오는 중…¦正在加载国家…
Couldn’t load countries.¦देश लोड नहीं हुए।¦No se pudieron cargar los países.¦Impossible de charger les pays.¦Länder konnten nicht geladen werden.¦Não foi possível carregar os países.¦تعذر تحميل البلدان.¦国を読み込めませんでした。¦국가를 불러오지 못했습니다.¦无法加载国家。
Retry countries¦देश फिर लोड करें¦Recargar países¦Recharger les pays¦Länder erneut laden¦Recarregar países¦أعد تحميل البلدان¦国を再読み込み¦국가 다시 불러오기¦重新加载国家
Couldn’t load availability¦उपलब्धता लोड नहीं हुई¦No se pudo cargar la disponibilidad¦Disponibilité indisponible¦Verfügbarkeit konnte nicht geladen werden¦Não foi possível carregar a disponibilidade¦تعذر تحميل التوفر¦配信情報を読み込めませんでした¦시청 정보를 불러오지 못했습니다¦无法加载观看信息
No platforms listed yet¦अभी कोई प्लेटफ़ॉर्म दर्ज नहीं है¦Aún no hay plataformas¦Aucune plateforme pour le moment¦Noch keine Plattformen gelistet¦Nenhuma plataforma listada ainda¦لا توجد منصات مدرجة بعد¦配信サービスの登録はありません¦등록된 플랫폼이 없습니다¦暂无平台信息
Please try again in a moment.¦कृपया थोड़ी देर में फिर कोशिश करें।¦Inténtalo de nuevo en un momento.¦Veuillez réessayer dans un instant.¦Bitte gleich noch einmal versuchen.¦Tente novamente em instantes.¦يرجى المحاولة بعد قليل.¦しばらくしてから再試行してください。¦잠시 후 다시 시도해 주세요.¦请稍后重试。
Search for a movie or web series and choose your country to see its streaming platforms.¦फ़िल्म या वेब सीरीज़ खोजें और उपलब्ध प्लेटफ़ॉर्म देखने के लिए अपना देश चुनें।¦Busca una película o serie y elige tu país para ver sus plataformas.¦Recherchez un film ou une série et choisissez votre pays pour voir les plateformes.¦Suche einen Film oder eine Serie und wähle dein Land, um Streamingdienste zu sehen.¦Busque um filme ou série e escolha seu país para ver as plataformas.¦ابحث عن فيلم أو مسلسل واختر بلدك لمعرفة منصات المشاهدة.¦映画やドラマを検索し、国を選んで配信サービスを確認できます。¦영화나 시리즈를 검색하고 국가를 선택해 시청 플랫폼을 확인하세요.¦搜索电影或剧集，选择国家或地区，查看可用的观看平台。
Search for a title¦फ़िल्म या सीरीज़ खोजें¦Buscar un título¦Rechercher un titre¦Titel suchen¦Buscar um título¦ابحث عن عمل¦作品を検索¦작품 검색¦搜索作品
Search movies and web series by title, mood, description, or something you already enjoy.¦नाम, मूड, विवरण या अपनी पसंद के आधार पर फ़िल्में और वेब सीरीज़ खोजें।¦Busca películas y series por título, ánimo, descripción o algo que ya te guste.¦Trouvez des films et séries par titre, humeur, description ou selon vos goûts.¦Finde Filme und Serien nach Titel, Stimmung, Beschreibung oder deinen Favoriten.¦Encontre filmes e séries por título, humor, descrição ou algo que você já gosta.¦ابحث عن الأفلام والمسلسلات بالعنوان أو المزاج أو الوصف أو حسب أعمال أعجبتك.¦タイトル、気分、内容、好きな作品から映画やドラマを探せます。¦제목, 기분, 설명 또는 좋아하는 작품으로 영화와 시리즈를 찾아보세요.¦按片名、心情、描述或喜欢的作品查找电影和剧集。
Find your next great watch¦देखने के लिए कुछ बढ़िया खोजें¦Encuentra tu próxima gran historia¦Trouvez votre prochaine découverte¦Finde dein nächstes Highlight¦Encontre sua próxima grande história¦اعثر على متعتك القادمة¦次のお気に入りを見つけよう¦다음에 볼 멋진 작품 찾기¦发现下一部好作品
What would you like to watch?¦आप क्या देखना चाहेंगे?¦¿Qué te gustaría ver?¦Que souhaitez-vous regarder ?¦Was möchtest du ansehen?¦O que você gostaria de assistir?¦ماذا تود أن تشاهد؟¦何を観たいですか？¦무엇을 보고 싶으세요?¦你想看什么？
Choose your moods¦अपना मूड चुनें¦Elige tu ánimo¦Choisissez vos humeurs¦Wähle deine Stimmung¦Escolha seu humor¦اختر مزاجك¦気分を選ぶ¦기분 선택¦选择心情
(matches all selected)¦(सभी चयन लागू होंगे)¦(coincide con todo lo elegido)¦(tous les critères s’appliquent)¦(alle gewählten gelten)¦(corresponde a todas as escolhas)¦(يطابق كل الاختيارات)¦（すべての条件に一致）¦(선택한 모든 조건 적용)¦（匹配所有选择）
Feel-good¦मन खुश करने वाला¦Reconfortante¦Réconfortant¦Wohlfühlfilm¦Leve e agradável¦مبهج¦心温まる¦기분 좋은¦治愈
Thrilling¦रोमांचक¦Emocionante¦Palpitant¦Spannend¦Eletrizante¦مثير¦スリル満点¦긴장감 있는¦惊险
Romantic¦रोमांटिक¦Romántico¦Romantique¦Romantisch¦Romântico¦رومانسي¦ロマンチック¦로맨틱한¦浪漫
Emotional¦भावुक¦Emotivo¦Émouvant¦Emotional¦Emocionante¦عاطفي¦感動的¦감동적인¦感人
Mind-bending¦दिमाग़ घुमा देने वाला¦Desconcertante¦Déroutant¦Verblüffend¦Surpreendente¦محير للعقل¦頭を使う¦생각하게 하는¦烧脑
Funny¦मज़ेदार¦Divertido¦Drôle¦Lustig¦Engraçado¦مضحك¦笑える¦웃긴¦搞笑
Genre¦शैली¦Género¦Genre¦Genre¦Gênero¦النوع¦ジャンル¦장르¦类型
Any genre¦कोई भी शैली¦Cualquier género¦Tous les genres¦Alle Genres¦Qualquer gênero¦أي نوع¦すべてのジャンル¦모든 장르¦不限类型
Any language¦कोई भी भाषा¦Cualquier idioma¦Toutes les langues¦Alle Sprachen¦Qualquer idioma¦أي لغة¦すべての言語¦모든 언어¦不限语言
Any runtime¦कोई भी अवधि¦Cualquier duración¦Toute durée¦Beliebige Laufzeit¦Qualquer duração¦أي مدة¦時間指定なし¦길이 제한 없음¦不限时长
Per episode for series¦सीरीज़ के लिए प्रति एपिसोड¦Por episodio en series¦Par épisode pour les séries¦Bei Serien pro Episode¦Por episódio nas séries¦لكل حلقة في المسلسلات¦ドラマは1話あたり¦시리즈는 에피소드 기준¦剧集按单集计算
Under {count} min¦{count} मिनट से कम¦Menos de {count} min¦Moins de {count} min¦Unter {count} Min.¦Menos de {count} min¦أقل من {count} دقيقة¦{count}分未満¦{count}분 미만¦少于{count}分钟
{count} minutes¦{count} मिनट¦{count} minutos¦{count} minutes¦{count} Minuten¦{count} minutos¦{count} دقيقة¦{count}分¦{count}분¦{count}分钟
{count} min¦{count} मिनट¦{count} min¦{count} min¦{count} Min.¦{count} min¦{count} دقيقة¦{count}分¦{count}분¦{count}分钟
{count} min/episode¦{count} मिनट/एपिसोड¦{count} min/episodio¦{count} min/épisode¦{count} Min./Episode¦{count} min/episódio¦{count} دقيقة/حلقة¦1話{count}分¦에피소드당 {count}분¦每集{count}分钟
{count} seasons · {episodes} episodes¦{count} सीज़न · {episodes} एपिसोड¦{count} temporadas · {episodes} episodios¦{count} saisons · {episodes} épisodes¦{count} Staffeln · {episodes} Episoden¦{count} temporadas · {episodes} episódios¦{count} مواسم · {episodes} حلقات¦{count}シーズン・{episodes}話¦{count}개 시즌 · {episodes}개 에피소드¦{count}季 · {episodes}集
{count} episodes¦{count} एपिसोड¦{count} episodios¦{count} épisodes¦{count} Episoden¦{count} episódios¦{count} حلقات¦{count}話¦{count}개 에피소드¦{count}集
Networks: {names}¦नेटवर्क: {names}¦Cadenas: {names}¦Chaînes : {names}¦Sender: {names}¦Emissoras: {names}¦الشبكات: {names}¦放送・配信：{names}¦방송사: {names}¦播出平台：{names}
In {country}¦{country} में¦En {country}¦En {country}¦In {country}¦Em {country}¦في {country}¦{country}で¦{country}에서¦在{country}
Checking availability in {country}…¦{country} में उपलब्धता जाँच रहे हैं…¦Comprobando disponibilidad en {country}…¦Vérification de la disponibilité en {country}…¦Verfügbarkeit in {country} wird geprüft…¦Verificando disponibilidade em {country}…¦جارٍ التحقق من التوفر في {country}…¦{country}の配信情報を確認中…¦{country} 시청 정보 확인 중…¦正在查看{country}的观看信息…
No streaming information for {country}. Try another country.¦{country} के लिए स्ट्रीमिंग जानकारी नहीं है। दूसरा देश चुनें।¦No hay información de streaming para {country}. Prueba otro país.¦Aucune information pour {country}. Essayez un autre pays.¦Keine Streaminginformationen für {country}. Wähle ein anderes Land.¦Sem informações de streaming para {country}. Tente outro país.¦لا توجد معلومات مشاهدة في {country}. جرّب بلدًا آخر.¦{country}の配信情報はありません。別の国をお試しください。¦{country}의 시청 정보가 없습니다. 다른 국가를 선택하세요.¦暂无{country}的观看信息，请选择其他国家或地区。
Couldn’t load this title¦यह शीर्षक लोड नहीं हुआ¦No se pudo cargar este título¦Impossible de charger ce titre¦Titel konnte nicht geladen werden¦Não foi possível carregar este título¦تعذر تحميل هذا العمل¦作品を読み込めませんでした¦작품을 불러오지 못했습니다¦无法加载作品
Getting to know this title…¦जानकारी लोड हो रही है…¦Cargando información del título…¦Chargement des informations…¦Titelinformationen werden geladen…¦Carregando informações do título…¦جارٍ تحميل معلومات العمل…¦作品情報を読み込み中…¦작품 정보 불러오는 중…¦正在加载作品信息…
Your matches¦आपके नतीजे¦Tus resultados¦Vos résultats¦Deine Treffer¦Seus resultados¦نتائجك¦検索結果¦검색 결과¦搜索结果
Let’s try that again¦फिर कोशिश करें¦Intentémoslo de nuevo¦Réessayons¦Versuchen wir es erneut¦Vamos tentar novamente¦لنحاول مجددًا¦もう一度試しましょう¦다시 시도해 볼까요¦请再试一次
No exact matches¦कोई सटीक नतीजा नहीं¦Sin coincidencias exactas¦Aucun résultat exact¦Keine genauen Treffer¦Nenhuma correspondência exata¦لا توجد نتائج مطابقة تمامًا¦完全に一致する作品はありません¦정확히 일치하는 결과 없음¦没有完全匹配的结果
{count} titles¦{count} शीर्षक¦{count} títulos¦{count} titres¦{count} Titel¦{count} títulos¦{count} أعمال¦{count}作品¦{count}개 작품¦{count}部作品
Your request: “{request}”¦आपकी खोज: “{request}”¦Tu búsqueda: «{request}»¦Votre recherche : « {request} »¦Deine Suche: „{request}“¦Sua busca: “{request}”¦بحثك: «{request}»¦検索条件：「{request}」¦검색 조건: “{request}”¦搜索条件：“{request}”
No matching titles. Try a different title.¦कोई शीर्षक नहीं मिला। दूसरा नाम आज़माएँ।¦No hay títulos coincidentes. Prueba otro.¦Aucun titre trouvé. Essayez un autre titre.¦Keine passenden Titel. Versuche einen anderen.¦Nenhum título encontrado. Tente outro.¦لا توجد أعمال مطابقة. جرّب عنوانًا آخر.¦一致する作品がありません。別のタイトルをお試しください。¦일치하는 작품이 없습니다. 다른 제목을 입력하세요.¦未找到作品，请尝试其他片名。
Try Inception, Wednesday, or Panchayat¦Inception, Wednesday या Panchayat खोजें¦Prueba Inception, Wednesday o Panchayat¦Essayez Inception, Wednesday ou Panchayat¦Zum Beispiel Inception, Wednesday oder Panchayat¦Tente Inception, Wednesday ou Panchayat¦جرّب Inception أو Wednesday أو Panchayat¦Inception、Wednesday、Panchayatなど¦Inception, Wednesday, Panchayat 검색¦试试 Inception、Wednesday 或 Panchayat
Previous genre — choose another¦पिछली शैली — दूसरी चुनें¦Género anterior: elige otro¦Genre précédent — changez de genre¦Vorheriges Genre — anderes wählen¦Gênero anterior — escolha outro¦النوع السابق — اختر غيره¦前のジャンル：選び直してください¦이전 장르 — 다른 장르 선택¦之前的类型，请重新选择
Describe what you want to watch¦बताएँ आप क्या देखना चाहते हैं¦Describe lo que quieres ver¦Décrivez ce que vous voulez regarder¦Beschreibe, was du sehen möchtest¦Descreva o que quer assistir¦صف ما تريد مشاهدته¦観たい作品を説明する¦보고 싶은 작품을 설명하세요¦描述你想看的作品
Choose what you want in common.¦चुनें कि क्या मिलता-जुलता हो।¦Elige qué deben tener en común.¦Choisissez les points communs souhaités.¦Wähle die Gemeinsamkeiten.¦Escolha o que devem ter em comum.¦اختر أوجه التشابه المطلوبة.¦共通してほしい点を選んでください。¦공통으로 원하는 요소를 선택하세요.¦选择你希望相似的方面。
What matters to you?¦आपके लिए क्या मायने रखता है?¦¿Qué te importa?¦Qu’est-ce qui compte pour vous ?¦Was ist dir wichtig?¦O que importa para você?¦ما الذي يهمك؟¦重視する点は？¦어떤 요소가 중요한가요?¦你看重哪些方面？
genres¦शैलियाँ¦géneros¦genres¦Genres¦gêneros¦الأنواع¦ジャンル¦장르¦类型
cast¦कलाकार¦reparto¦distribution¦Besetzung¦elenco¦طاقم التمثيل¦キャスト¦출연진¦演员
romance¦प्रेमकथा¦romance¦romance¦Romantik¦romance¦الرومانسية¦恋愛要素¦로맨스¦爱情元素
Trending today¦आज के लोकप्रिय शीर्षक¦Tendencias de hoy¦Tendances du jour¦Heute im Trend¦Em alta hoje¦الرائج اليوم¦今日のトレンド¦오늘의 인기작¦今日热门
Movies and series getting attention today¦आज चर्चा में फ़िल्में और सीरीज़¦Películas y series que destacan hoy¦Films et séries à la une aujourd’hui¦Filme und Serien, die heute gefragt sind¦Filmes e séries em destaque hoje¦أفلام ومسلسلات تحظى بالاهتمام اليوم¦今日注目の映画とドラマ¦오늘 주목받는 영화와 시리즈¦今日备受关注的电影和剧集
Show less¦कम दिखाएँ¦Mostrar menos¦Voir moins¦Weniger anzeigen¦Mostrar menos¦عرض أقل¦閉じる¦접기¦收起
View all¦सभी देखें¦Ver todo¦Tout voir¦Alle anzeigen¦Ver tudo¦عرض الكل¦すべて見る¦모두 보기¦查看全部
Good films. Great finds.¦अच्छी फ़िल्में। बढ़िया खोज।¦Buen cine. Grandes hallazgos.¦De bons films. De belles découvertes.¦Gute Filme. Große Entdeckungen.¦Bons filmes. Grandes descobertas.¦أفلام رائعة. اكتشافات مميزة.¦いい映画との出会い。¦좋은 영화, 멋진 발견.¦好电影，等你发现。
Today’s¦आज का¦Hoy:¦Aujourd’hui :¦Heute:¦Hoje:¦اختيار اليوم¦今日の¦오늘의¦今日
The spotlight¦आज की ख़ास पेशकश¦En primer plano¦À l’affiche¦Im Rampenlicht¦Em destaque¦تحت الأضواء¦スポットライト¦스포트라이트¦焦点推荐
The story¦कहानी¦La historia¦L’histoire¦Die Geschichte¦A história¦القصة¦ストーリー¦줄거리¦故事
Finding your next great film…¦आपके लिए बढ़िया फ़िल्म खोज रहे हैं…¦Buscando tu próxima gran película…¦Recherche de votre prochain film…¦Dein nächster Film wird gesucht…¦Buscando seu próximo grande filme…¦جارٍ البحث عن فيلمك القادم…¦次のお気に入りを検索中…¦다음에 볼 영화를 찾는 중…¦正在寻找下一部好电影…
Let’s find your next film.¦आपकी अगली फ़िल्म खोजें।¦Encontremos tu próxima película.¦Trouvons votre prochain film.¦Finden wir deinen nächsten Film.¦Vamos encontrar seu próximo filme.¦لنعثر على فيلمك القادم.¦次に観る映画を見つけよう。¦다음에 볼 영화를 찾아볼까요.¦寻找你的下一部电影。
Poster unavailable¦पोस्टर उपलब्ध नहीं¦Póster no disponible¦Affiche indisponible¦Poster nicht verfügbar¦Pôster indisponível¦الملصق غير متاح¦ポスターはありません¦포스터 없음¦暂无海报
Year not recorded¦वर्ष दर्ज नहीं है¦Año no registrado¦Année non renseignée¦Jahr nicht erfasst¦Ano não informado¦السنة غير مسجلة¦年の情報なし¦연도 정보 없음¦暂无年份
Language not recorded¦भाषा दर्ज नहीं है¦Idioma no registrado¦Langue non renseignée¦Sprache nicht erfasst¦Idioma não informado¦اللغة غير مسجلة¦言語の情報なし¦언어 정보 없음¦暂无语言信息
Air date not recorded¦प्रसारण की तारीख दर्ज नहीं है¦Fecha de estreno no registrada¦Date de diffusion non renseignée¦Sendetermin nicht erfasst¦Data de exibição não informada¦تاريخ العرض غير مسجل¦放送日の情報なし¦방영일 정보 없음¦暂无播出日期
Could not load data. Please retry.¦जानकारी लोड नहीं हुई। कृपया फिर कोशिश करें।¦No se pudieron cargar los datos. Inténtalo de nuevo.¦Impossible de charger les données. Veuillez réessayer.¦Daten konnten nicht geladen werden. Bitte erneut versuchen.¦Não foi possível carregar os dados. Tente novamente.¦تعذر تحميل البيانات. يرجى المحاولة مجددًا.¦データを読み込めませんでした。再試行してください。¦데이터를 불러오지 못했습니다. 다시 시도해 주세요.¦无法加载数据，请重试。
Sitemap¦साइटमैप¦Mapa del sitio¦Plan du site¦Sitemap¦Mapa do site¦خريطة الموقع¦サイトマップ¦사이트맵¦网站地图
Credits¦श्रेय¦Créditos¦Crédits¦Quellen¦Créditos¦الشكر والمصادر¦クレジット¦출처¦数据来源
cinemine · For the love of a good story.¦cinemine · अच्छी कहानियों के लिए।¦cinemine · Por amor a una buena historia.¦cinemine · Pour l’amour des belles histoires.¦cinemine · Aus Liebe zu guten Geschichten.¦cinemine · Pelo amor a uma boa história.¦cinemine · حبًا في القصص الجميلة.¦cinemine · すてきな物語を愛して。¦cinemine · 좋은 이야기를 사랑하는 마음.¦cinemine · 因为热爱好故事。
Skip to content¦मुख्य सामग्री पर जाएँ¦Ir al contenido¦Aller au contenu¦Zum Inhalt springen¦Ir para o conteúdo¦انتقل إلى المحتوى¦本文へ移動¦본문으로 건너뛰기¦跳到正文
Close dialog¦संवाद बंद करें¦Cerrar diálogo¦Fermer la fenêtre¦Dialog schließen¦Fechar janela¦إغلاق النافذة¦閉じる¦창 닫기¦关闭对话框
Main navigation¦मुख्य नेविगेशन¦Navegación principal¦Navigation principale¦Hauptnavigation¦Navegação principal¦التنقل الرئيسي¦メインナビゲーション¦주 메뉴¦主导航
Mobile navigation¦मोबाइल नेविगेशन¦Navegación móvil¦Navigation mobile¦Mobile Navigation¦Navegação móvel¦التنقل على الهاتف¦モバイルナビゲーション¦모바일 메뉴¦移动导航
Open navigation¦नेविगेशन खोलें¦Abrir navegación¦Ouvrir la navigation¦Navigation öffnen¦Abrir navegação¦فتح التنقل¦メニューを開く¦메뉴 열기¦打开导航
Close navigation¦नेविगेशन बंद करें¦Cerrar navegación¦Fermer la navigation¦Navigation schließen¦Fechar navegação¦إغلاق التنقل¦メニューを閉じる¦메뉴 닫기¦关闭导航
Search movies and series¦फ़िल्में और सीरीज़ खोजें¦Buscar películas y series¦Rechercher des films et séries¦Filme und Serien suchen¦Buscar filmes e séries¦ابحث عن الأفلام والمسلسلات¦映画・ドラマを検索¦영화와 시리즈 검색¦搜索电影和剧集
Footer¦पादलेख¦Pie de página¦Pied de page¦Fußzeile¦Rodapé¦تذييل الصفحة¦フッター¦푸터¦页脚
· A closer look¦· एक नज़र¦· Más de cerca¦· De plus près¦· Ein genauer Blick¦· Um olhar mais perto¦· نظرة أقرب¦・詳しく見る¦· 자세히 보기¦· 进一步了解
· Your next watch¦· आपकी अगली पसंद¦· Tu próxima elección¦· Votre prochain choix¦· Dein nächster Titel¦· Sua próxima escolha¦· مشاهدتك القادمة¦・次に観る作品¦· 다음에 볼 작품¦· 下一部想看的作品
`.trim().split('\n').map(row => row.split('¦'))

export const messages = Object.fromEntries(languages.map((language, index) => [language.code, Object.fromEntries([...rows, ...secondaryRows].map(row => [row[0], row[index]]))]))
const aliases = { 'Find Movies & Series': 'Find movies & series', 'Release Calendar': 'Release calendar', 'All genres': 'Any genre', 'All languages': 'Any language', 'Explore film': 'Explore this film', 'Explore films': 'Explore', 'Find my movie': 'Find movies & series', 'Search movies and series (⌘/Ctrl + K)': 'Search movies and series' }
Object.assign(aliases, {
  'A good film is worth sharing': 'Share film', 'Send a little cinema.': 'Share film',
  'Around Cinemine': 'Explore', 'Site directory': 'Sitemap', 'Site pages': 'Main navigation',
  'Featured titles': 'Trending today', 'Daily trends and today’s CinePicks': 'Trending today',
  'Finding something to watch…': 'Finding titles…', 'Loading releases…': 'Loading titles…', 'Loading movie links…': 'Loading titles…',
  'Movie links are temporarily unavailable.': 'Could not load data. Please retry.', 'Couldn’t load release dates': 'Could not load data. Please retry.',
  'Movie release calendar': 'Release calendar', 'Release calendar view': 'Calendar', 'Calendar navigation and filters': 'Calendar',
  'Month calendar; scroll horizontally on small screens': 'Calendar', 'Regional movie release dates': 'Release calendar',
  'Edit search preferences': 'Search by', 'Movie-night companion': 'Surprise me', 'Surprise me with a film': 'Surprise me',
  'Your movie-night surprise.': 'Your surprise pick.', 'cinemine home': 'Explore',
  'Search by title, mood, description, or a similar film': 'Search movies and web series by title, mood, description, or something you already enjoy.',
  'Find your way to a film, a release date, or your next movie night.': 'Search movies and web series by title, mood, description, or something you already enjoy.',
  'Search movies and series for streaming platforms': 'Search for a movie or web series and choose your country to see its streaming platforms.',
  'Visit @dr.cinemine on Instagram': 'From our Instagram', 'Visit The Movie Database': 'The Movie Database',
  'A movie, a mood, or a story you have in mind…': 'Search movies and series', 'Describe a movie, mood, or story': 'Describe what you want to watch',
  'Stories worth sharing. Films worth saving.': 'Good films. Great finds.',
  'Science Fiction': 'Sci-fi',
  'A synopsis is not available for this film.': 'Not recorded', 'Untitled film': 'Movie',
  'Film information is temporarily unavailable. Please try again.': 'Could not load data. Please retry.',
  'This film could not be found.': 'The page you’re looking for could not be found.',
  'This title could not be found.': 'The page you’re looking for could not be found.',
})
export function translate(code, text, values = {}) {
  const key = aliases[text] ?? text
  const translated = code === 'en' ? text : messages[getLanguage(code).code]?.[key] ?? text
  return translated.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match)
}
