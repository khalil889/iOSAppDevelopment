/** Arabic names and descriptions for the demo content, keyed like seed-data.ts. */

export const COUNTRIES_AR: Record<string, string> = {
  SA: 'المملكة العربية السعودية',
  EG: 'مصر',
  JO: 'الأردن',
  AE: 'الإمارات العربية المتحدة',
};

export const CITIES_AR: Record<string, string> = {
  riyadh: 'الرياض',
  jeddah: 'جدة',
  alula: 'العُلا',
  cairo: 'القاهرة',
  luxor: 'الأقصر',
  petra: 'البتراء',
  amman: 'عمّان',
  dubai: 'دبي',
};

export const SITES_AR: Record<string, { name: string; description: string }> = {
  turaif: { name: 'حي الطريف (الدرعية)', description: 'موطن الدولة السعودية الأولى، مبانٍ طينية مسجلة في قائمة اليونسكو.' },
  masmak: { name: 'قصر المصمك', description: 'حصن من الطين واللبن في قلب الرياض القديمة.' },
  nationalmuseum: { name: 'المتحف الوطني السعودي', description: 'ثماني قاعات تروي تاريخ الجزيرة العربية من عصور ما قبل التاريخ حتى اليوم.' },
  edge: { name: 'حافة العالم (جبل الفهرين)', description: 'منحدرات شاهقة في سلسلة جبال طويق.' },
  albalad: { name: 'جدة التاريخية (البلد)', description: 'بيوت من الحجر المنقبي برواشين خشبية، ومسجلة في قائمة اليونسكو.' },
  corniche: { name: 'كورنيش جدة', description: 'واجهة بحرية على البحر الأحمر بطول 30 كم مع نافورة الملك فهد.' },
  hegra: { name: 'الحِجر (مدائن صالح)', description: 'مقابر نبطية منحوتة في الصخر، وأول موقع سعودي في قائمة اليونسكو.' },
  elephant: { name: 'جبل الفيل', description: 'تكوين صخري رملي شاهق على هيئة فيل.' },
  oldtown: { name: 'البلدة القديمة في العُلا', description: 'متاهة من 900 بيت طيني أسفل قلعة على التل.' },
  giza: { name: 'أهرامات الجيزة', description: 'الهرم الأكبر وهرما خفرع ومنقرع وأبو الهول.' },
  gem: { name: 'المتحف المصري الكبير', description: 'يضم مجموعة توت عنخ آمون كاملة.' },
  khanelkhalili: { name: 'خان الخليلي', description: 'سوق يعود إلى القرن الرابع عشر في القاهرة الإسلامية.' },
  karnak: { name: 'معابد الكرنك', description: 'مجمع معابد ضخم يضم بهو الأعمدة الكبير.' },
  valleykings: { name: 'وادي الملوك', description: 'مقابر ملوك الدولة الحديثة.' },
  treasury: { name: 'البتراء — الخزنة', description: 'الواجهة الوردية الشهيرة في نهاية السيق.' },
  monastery: { name: 'البتراء — الدير', description: 'صعود 800 درجة إلى أكبر معالم البتراء.' },
  citadel: { name: 'جبل القلعة في عمّان', description: 'معبد هرقل والقصر الأموي فوق وسط البلد.' },
  aldeira: { name: 'حي الفهيدي التاريخي', description: 'بيوت البراجيل ومتحف دبي على ضفاف الخور.' },
};

/** Keyed by the English package title. */
export const PACKAGES_AR: Record<string, { title: string; description: string }> = {
  'Diriyah at Golden Hour': { title: 'الدرعية وقت الغروب', description: 'جولة في حي الطريف ومطل البجيري مع غروب الشمس.' },
  'Old Riyadh Heritage Walk': { title: 'جولة تراث الرياض القديمة', description: 'قصر المصمك وسوق الزل والمتحف الوطني.' },
  'Hegra Tombs Discovery': { title: 'اكتشاف مقابر الحِجر', description: 'المقابر النبطية في الحِجر مع مرشد مرخّص للموقع.' },
  'AlUla Sunset & Old Town': { title: 'غروب العُلا والبلدة القديمة', description: 'أزقة البلدة القديمة ثم الغروب عند جبل الفيل.' },
  'Al-Balad Stories & Street Food': { title: 'حكايات البلد وأكلات الشارع', description: 'جدة التاريخية مع تذوق المطبق والسوبيا.' },
  'Giza Pyramids & Sphinx': { title: 'أهرامات الجيزة وأبو الهول', description: 'انطلاقة مبكرة لتسبق الزحام على هضبة الجيزة.' },
  'Grand Egyptian Museum Highlights': { title: 'أبرز معروضات المتحف المصري الكبير', description: 'قاعات توت عنخ آمون والدرج العظيم.' },
  'Luxor East & West Bank': { title: 'الأقصر: البر الشرقي والغربي', description: 'الكرنك صباحًا، ووادي الملوك بعد الغداء.' },
  'Petra Full Day: Siq to Monastery': { title: 'يوم كامل في البتراء: من السيق إلى الدير', description: 'السيق والخزنة وشارع الواجهات وصعود الدير.' },
  'Edge of the World Sunset 4x4': { title: 'غروب حافة العالم بسيارة دفع رباعي', description: 'رحلة بالدفع الرباعي إلى جبل الفهرين لمشاهدة الغروب.' },
};
