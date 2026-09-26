import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';

/// Languages a guide can offer a tour in (ISO 639-1).
const tourLanguageCodes = ['ar', 'en', 'fr', 'es', 'de', 'it', 'zh', 'ru', 'ur', 'hi', 'tr'];

String tourLanguageName(AppLocalizations l10n, String code) => switch (code) {
      'ar' => l10n.exploreLangAr,
      'en' => l10n.exploreLangEn,
      'fr' => l10n.exploreLangFr,
      'es' => l10n.exploreLangEs,
      'de' => l10n.exploreLangDe,
      'it' => l10n.exploreLangIt,
      'ur' => l10n.exploreLangUr,
      'zh' => l10n.toursLangZh,
      'ru' => l10n.toursLangRu,
      'hi' => l10n.toursLangHi,
      'tr' => l10n.toursLangTr,
      _ => code.toUpperCase(),
    };

const _maxPhotos = 6;
const _maxPhotoBytes = 5 * 1024 * 1024;
const _maxPriceMinor = 10000000;
const _minDuration = 30, _maxDuration = 12 * 60, _durationStep = 30;

/// A tour photo: already stored (key + url) or picked and uploading (bytes).
class _Photo {
  _Photo({this.key, this.url, this.bytes});
  String? key;
  final String? url;
  final Uint8List? bytes;
  bool get uploading => key == null;
}

/// Create a tour (no [tour]) or edit one of the guide's tours.
class TourFormScreen extends StatefulWidget {
  const TourFormScreen({super.key, this.tour});
  final GuideTour? tour;

  @override
  State<TourFormScreen> createState() => _TourFormScreenState();
}

class _TourFormScreenState extends State<TourFormScreen> {
  final _form = GlobalKey<FormState>();
  late final GuideTour? _t = widget.tour;
  late final _title = TextEditingController(text: _t?.title);
  late final _description = TextEditingController(text: _t?.description);
  late final _titleAr = TextEditingController(text: _t?.titleAr);
  late final _descriptionAr = TextEditingController(text: _t?.descriptionAr);
  late final _price = TextEditingController(
    text: _t == null ? '' : minorToMajorText(_t.priceMinor, _t.currency),
  );

  late Future<List<TourCity>> _citiesFuture;
  List<TourCity> _cities = [];
  late String? _cityId = _t?.cityId;
  List<TourSite>? _sites;
  late final Set<String> _siteIds = {...?_t?.siteIds};
  late int _duration = _t?.durationMinutes ?? 120;
  late String _pricingType = _t?.pricingType ?? 'PER_GROUP';
  late int _groupSize = _t?.maxGroupSize ?? 8;
  late final Set<String> _languages = {...?_t?.languages};
  late final List<_Photo> _photos = [
    for (var i = 0; i < (_t?.photoKeys.length ?? 0); i++)
      _Photo(key: _t!.photoKeys[i], url: i < _t.photoUrls.length ? _t.photoUrls[i] : null),
  ];
  late bool _active = _t?.isActive ?? true;
  bool _saving = false;
  bool _languagesError = false;

  bool get _editing => _t != null;
  bool get _uploading => _photos.any((p) => p.uploading);
  int get _maxDurationAllowed => _duration > _maxDuration ? _duration : _maxDuration;

  TourCity? get _city => _cities.where((c) => c.id == _cityId).firstOrNull;

  /// Currency of the chosen city; the tour's own currency while its city is unchanged.
  String? get _currency => _city?.currency ?? (_cityId != null && _cityId == _t?.cityId ? _t?.currency : null);

  @override
  void initState() {
    super.initState();
    _citiesFuture = _loadCities();
  }

  @override
  void dispose() {
    for (final c in [_title, _description, _titleAr, _descriptionAr, _price]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<List<TourCity>> _loadCities() async {
    final repo = context.read<Repository>();
    final cities = await repo.myTourCities();
    // Keep the tour's current city selectable even if it left the profile.
    final own = _t?.city;
    if (own != null && !cities.any((c) => c.id == own.id)) cities.add(own);
    _cities = cities;
    if (_cityId == null && cities.length == 1) _cityId = cities.first.id;
    if (_cityId != null) _loadSites(_cityId!);
    return cities;
  }

  Future<void> _loadSites(String cityId) async {
    setState(() => _sites = null);
    try {
      final sites = await context.read<Repository>().citySites(cityId);
      if (!mounted || cityId != _cityId) return;
      // Sites already on the tour stay visible even beyond the first page.
      final extra = cityId == _t?.cityId ? _t!.sites.where((s) => !sites.any((x) => x.id == s.id)) : <TourSite>[];
      setState(() => _sites = [...sites, ...extra]);
    } catch (e) {
      if (!mounted) return;
      setState(() => _sites = const []);
      showError(context, e);
    }
  }

  void _selectCity(String? id) {
    if (id == null || id == _cityId) return;
    setState(() {
      _cityId = id;
      _siteIds.clear();
    });
    _loadSites(id);
  }

  Future<void> _addPhoto() async {
    final l10n = context.l10n;
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: const Icon(Icons.photo_camera_outlined),
            title: Text(l10n.toursTakePhoto),
            onTap: () => Navigator.pop(ctx, ImageSource.camera),
          ),
          ListTile(
            leading: const Icon(Icons.photo_library_outlined),
            title: Text(l10n.toursChoosePhoto),
            onTap: () => Navigator.pop(ctx, ImageSource.gallery),
          ),
        ]),
      ),
    );
    if (source == null || !mounted) return;
    final repo = context.read<Repository>();
    final picked = await ImagePicker().pickImage(source: source, maxWidth: 2400, imageQuality: 85);
    if (picked == null || !mounted) return;
    final bytes = await picked.readAsBytes();
    if (!mounted) return;
    if (bytes.length > _maxPhotoBytes) {
      showMessage(context, l10n.toursPhotoTooLarge);
      return;
    }
    final name = picked.name.toLowerCase();
    final contentType = name.endsWith('.png')
        ? 'image/png'
        : name.endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg';
    final photo = _Photo(bytes: bytes);
    setState(() => _photos.add(photo));
    try {
      final key = await repo.uploadTourPhoto(bytes, contentType);
      if (mounted) setState(() => photo.key = key);
    } catch (e) {
      if (!mounted) return;
      setState(() => _photos.remove(photo));
      showError(context, e);
    }
  }

  String? _validatePrice(String? v) {
    final l10n = context.l10n;
    final currency = _currency ?? 'USD';
    if ((v ?? '').trim().isEmpty) return l10n.toursPriceRequired;
    final minor = parseMajorToMinor(v!, currency);
    if (minor == null) return l10n.toursPriceInvalid(currencyExponent(currency));
    if (minor > _maxPriceMinor) return l10n.toursPriceTooHigh(bidiLtr(formatMoney(_maxPriceMinor, currency)));
    return null;
  }

  Future<void> _save() async {
    final valid = _form.currentState!.validate();
    setState(() => _languagesError = _languages.isEmpty);
    if (!valid || _languages.isEmpty || _cityId == null) return;
    final l10n = context.l10n;
    final repo = context.read<Repository>();
    final input = TourInput(
      cityId: _cityId!,
      title: _title.text,
      titleAr: _titleAr.text,
      description: _description.text,
      descriptionAr: _descriptionAr.text,
      durationMinutes: _duration,
      pricingType: _pricingType,
      priceMinor: parseMajorToMinor(_price.text, _currency ?? 'USD')!,
      maxGroupSize: _groupSize,
      languages: [for (final c in tourLanguageCodes) if (_languages.contains(c)) c],
      siteIds: [for (final s in _sites ?? const <TourSite>[]) if (_siteIds.contains(s.id)) s.id],
      photoKeys: [for (final p in _photos) p.key!],
      isActive: _editing ? _active : null,
    );
    setState(() => _saving = true);
    try {
      final saved = _editing ? await repo.updateTour(_t!.id, input.toJson(update: true)) : await repo.createTour(input);
      if (!mounted) return;
      showMessage(context, _editing ? l10n.toursSaved : l10n.toursCreated);
      Navigator.pop(context, saved);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(_editing ? l10n.toursEditTitle : l10n.toursNewTitle)),
      body: FutureBuilder<List<TourCity>>(
        future: _citiesFuture,
        builder: (context, snap) {
          if (snap.hasError) {
            return ErrorView(error: snap.error!, onRetry: () => setState(() => _citiesFuture = _loadCities()));
          }
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          if (snap.data!.isEmpty) {
            return EmptyView(icon: Icons.location_city_outlined, message: l10n.toursNoCities);
          }
          return _body();
        },
      ),
    );
  }

  Widget _section(String title, {String? subtitle}) => Padding(
        padding: const EdgeInsetsDirectional.only(top: 20, bottom: 8),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          if (subtitle != null) Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
        ]),
      );

  Widget _label(String text) => Padding(
        padding: const EdgeInsetsDirectional.only(top: 16, bottom: 6),
        child: Text(text, style: Theme.of(context).textTheme.labelLarge),
      );

  Widget _body() {
    final l10n = context.l10n;
    final ar = context.isArabic;
    final currency = _currency;
    String? optionalTitle(String? v) {
      final s = (v ?? '').trim();
      return s.isNotEmpty && s.length < 3 ? l10n.toursTitleTooShort : null;
    }

    return Form(
      key: _form,
      child: ListView(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 32),
        children: [
          _section(l10n.toursSectionEnglish),
          TextFormField(
            key: const ValueKey('tourTitleEn'),
            controller: _title,
            textDirection: TextDirection.ltr,
            maxLength: 160,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(labelText: l10n.toursTitleEnLabel),
            validator: (v) => (v ?? '').trim().length < 3 ? l10n.toursTitleRequired : null,
          ),
          TextFormField(
            key: const ValueKey('tourDescriptionEn'),
            controller: _description,
            textDirection: TextDirection.ltr,
            minLines: 3,
            maxLines: 8,
            maxLength: 4000,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(labelText: l10n.toursDescriptionEnLabel, hintText: l10n.toursDescriptionHint),
          ),
          _section(l10n.toursSectionArabic, subtitle: l10n.toursArabicHint),
          TextFormField(
            key: const ValueKey('tourTitleAr'),
            controller: _titleAr,
            textDirection: TextDirection.rtl,
            textAlign: TextAlign.right,
            maxLength: 160,
            decoration: InputDecoration(labelText: l10n.toursTitleArLabel),
            validator: optionalTitle,
          ),
          TextFormField(
            key: const ValueKey('tourDescriptionAr'),
            controller: _descriptionAr,
            textDirection: TextDirection.rtl,
            textAlign: TextAlign.right,
            minLines: 3,
            maxLines: 8,
            maxLength: 4000,
            decoration: InputDecoration(labelText: l10n.toursDescriptionArLabel),
          ),
          _section(l10n.toursSectionDetails),
          DropdownButtonFormField<String>(
            key: const ValueKey('tourCity'),
            initialValue: _cityId,
            decoration: InputDecoration(labelText: l10n.toursCityLabel),
            items: [for (final c in _cities) DropdownMenuItem(value: c.id, child: Text(c.displayName(ar)))],
            onChanged: _saving ? null : _selectCity,
            validator: (v) => v == null ? l10n.toursCityRequired : null,
          ),
          _label(l10n.toursSitesLabel),
          if (_cityId == null)
            Text(l10n.toursSitesPickCity, style: Theme.of(context).textTheme.bodySmall)
          else if (_sites == null)
            const Padding(padding: EdgeInsets.all(8), child: Center(child: CircularProgressIndicator()))
          else if (_sites!.isEmpty)
            Text(l10n.toursSitesEmpty, style: Theme.of(context).textTheme.bodySmall)
          else
            Wrap(spacing: 8, runSpacing: 4, children: [
              for (final s in _sites!)
                FilterChip(
                  label: Text(s.displayName(ar)),
                  selected: _siteIds.contains(s.id),
                  onSelected: (on) => setState(() => on ? _siteIds.add(s.id) : _siteIds.remove(s.id)),
                ),
            ]),
          _label(l10n.toursDurationLabel),
          _stepper(
            value: formatDuration(_duration),
            onMinus: _duration > _minDuration ? () => setState(() => _duration = ((_duration - 1) ~/ _durationStep) * _durationStep) : null,
            onPlus: _duration < _maxDurationAllowed
                ? () => setState(() => _duration = (_duration ~/ _durationStep + 1) * _durationStep)
                : null,
          ),
          _label(l10n.toursPricingLabel),
          SegmentedButton<String>(
            segments: [
              ButtonSegment(value: 'PER_GROUP', label: Text(l10n.toursPricingPerGroup), icon: const Icon(Icons.groups_outlined)),
              ButtonSegment(value: 'PER_PERSON', label: Text(l10n.toursPricingPerPerson), icon: const Icon(Icons.person_outline)),
            ],
            selected: {_pricingType},
            onSelectionChanged: (s) => setState(() => _pricingType = s.first),
          ),
          const SizedBox(height: 12),
          TextFormField(
            key: const ValueKey('tourPrice'),
            controller: _price,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            textDirection: TextDirection.ltr,
            decoration: InputDecoration(
              labelText: l10n.toursPriceLabel,
              helperText: _pricingType == 'PER_PERSON' ? l10n.toursPriceHelperPerPerson : l10n.toursPriceHelperPerGroup,
              suffixText: currency,
            ),
            validator: _validatePrice,
          ),
          _label(l10n.toursGroupSizeLabel),
          _stepper(
            value: l10n.toursPeople(_groupSize),
            onMinus: _groupSize > 1 ? () => setState(() => _groupSize--) : null,
            onPlus: _groupSize < 50 ? () => setState(() => _groupSize++) : null,
          ),
          _label(l10n.toursLanguagesLabel),
          Wrap(spacing: 8, runSpacing: 4, children: [
            for (final code in tourLanguageCodes)
              FilterChip(
                label: Text(tourLanguageName(l10n, code)),
                selected: _languages.contains(code),
                onSelected: (on) => setState(() {
                  on ? _languages.add(code) : _languages.remove(code);
                  if (_languages.isNotEmpty) _languagesError = false;
                }),
              ),
          ]),
          if (_languagesError)
            Padding(
              padding: const EdgeInsetsDirectional.only(top: 4, start: 12),
              child: Text(l10n.toursLanguagesRequired,
                  style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 12)),
            ),
          _section(l10n.toursPhotosLabel, subtitle: l10n.toursPhotosHint(_maxPhotos)),
          SizedBox(
            height: 112,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                for (var i = 0; i < _photos.length; i++) _thumb(i),
                if (_photos.length < _maxPhotos)
                  Padding(
                    padding: const EdgeInsetsDirectional.only(end: 8),
                    child: SizedBox(
                      width: 100,
                      child: OutlinedButton(
                        onPressed: _saving ? null : _addPhoto,
                        style: OutlinedButton.styleFrom(
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.add_a_photo_outlined),
                          const SizedBox(height: 4),
                          Text(l10n.toursAddPhoto, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12)),
                        ]),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (_editing) ...[
            const SizedBox(height: 12),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(l10n.toursActiveToggle),
              subtitle: Text(l10n.toursActiveHint),
              value: _active,
              onChanged: (v) => setState(() => _active = v),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _saving || _uploading ? null : _save,
            child: Text(_saving ? l10n.toursSaving : (_editing ? l10n.toursSave : l10n.toursCreate)),
          ),
        ],
      ),
    );
  }

  Widget _stepper({required String value, VoidCallback? onMinus, VoidCallback? onPlus}) {
    final l10n = context.l10n;
    return Row(children: [
      IconButton.outlined(onPressed: onMinus, tooltip: l10n.toursDecrease, icon: const Icon(Icons.remove)),
      Expanded(
        child: Text(
          value,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleMedium,
        ),
      ),
      IconButton.outlined(onPressed: onPlus, tooltip: l10n.toursIncrease, icon: const Icon(Icons.add)),
    ]);
  }

  Widget _thumb(int i) {
    final l10n = context.l10n;
    final p = _photos[i];
    final scheme = Theme.of(context).colorScheme;
    final image = p.bytes != null
        ? ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.memory(p.bytes!, width: 100, height: 112, fit: BoxFit.cover),
          )
        : NetImage(p.url, width: 100, height: 112);
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 8),
      child: SizedBox(
        width: 100,
        child: Stack(fit: StackFit.expand, children: [
          image,
          if (p.uploading)
            Container(
              decoration: BoxDecoration(color: Colors.black38, borderRadius: BorderRadius.circular(12)),
              alignment: Alignment.center,
              child: Semantics(
                label: l10n.toursPhotoUploading,
                child: const SizedBox(width: 28, height: 28, child: CircularProgressIndicator(color: Colors.white)),
              ),
            ),
          if (i == 0)
            PositionedDirectional(
              start: 4,
              bottom: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: scheme.primary, borderRadius: BorderRadius.circular(8)),
                child: Text(l10n.toursCover, style: TextStyle(color: scheme.onPrimary, fontSize: 11)),
              ),
            ),
          PositionedDirectional(
            top: 0,
            end: 0,
            child: PopupMenuButton<String>(
              tooltip: MaterialLocalizations.of(context).showMenuTooltip,
              icon: const CircleAvatar(radius: 13, backgroundColor: Colors.black54, child: Icon(Icons.more_vert, size: 16, color: Colors.white)),
              onSelected: (action) => setState(() {
                final photo = _photos.removeAt(i);
                if (action == 'cover') _photos.insert(0, photo);
              }),
              itemBuilder: (_) => [
                if (i > 0) PopupMenuItem(value: 'cover', child: Text(l10n.toursMakeCover)),
                PopupMenuItem(value: 'remove', child: Text(l10n.toursRemovePhoto)),
              ],
            ),
          ),
        ]),
      ),
    );
  }
}
