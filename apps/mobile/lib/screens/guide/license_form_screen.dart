import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';

/// Submit license details for admin verification (runs the KYC check server-side).
class LicenseFormScreen extends StatefulWidget {
  const LicenseFormScreen({super.key});

  @override
  State<LicenseFormScreen> createState() => _LicenseFormScreenState();
}

class _LicenseFormScreenState extends State<LicenseFormScreen> {
  final _form = GlobalKey<FormState>();
  final _number = TextEditingController();
  Uint8List? _photo;
  String? _photoKey;
  bool _uploading = false;
  List<Country> _countries = [];
  String? _countryId;
  DateTime? _expires;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    context.read<Repository>().countries().then((c) {
      if (mounted) setState(() => _countries = c);
    }).catchError((Object e) {
      if (mounted) showError(context, e);
    });
  }

  @override
  void dispose() {
    _number.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(ImageSource source) async {
    final repo = context.read<Repository>();
    final picked = await ImagePicker().pickImage(source: source, maxWidth: 2400, imageQuality: 85);
    if (picked == null || !mounted) return;
    final bytes = await picked.readAsBytes();
    final contentType = picked.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    setState(() {
      _photo = bytes;
      _photoKey = null;
      _uploading = true;
    });
    try {
      final key = await repo.uploadLicense(bytes, contentType);
      if (mounted) setState(() => _photoKey = key);
    } catch (e) {
      if (mounted) {
        setState(() => _photo = null);
        showError(context, e);
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    if (_photoKey == null) {
      showMessage(context, 'Add a photo of your license first.');
      return;
    }
    setState(() => _busy = true);
    try {
      await context.read<Repository>().submitLicense(
            licenseNumber: _number.text.trim(),
            countryId: _countryId!,
            expiresAt: DateFormat('yyyy-MM-dd').format(_expires!),
            documentKey: _photoKey,
          );
      if (!mounted) return;
      showMessage(context, 'Submitted for verification');
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final code = _countries.where((c) => c.id == _countryId).firstOrNull?.code;
    return Scaffold(
      appBar: AppBar(title: const Text('Tourism license')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const Text('We verify every guide against the issuing authority before they can take bookings.'),
            const SizedBox(height: 20),
            DropdownButtonFormField<String>(
              initialValue: _countryId,
              decoration: const InputDecoration(labelText: 'Issuing country'),
              items: [for (final c in _countries) DropdownMenuItem(value: c.id, child: Text(c.name))],
              onChanged: (v) => setState(() => _countryId = v),
              validator: (v) => v == null ? 'Select a country' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _number,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(labelText: 'License number', hintText: code != null ? '$code-123456' : null),
              validator: (v) => (v ?? '').trim().length < 3 ? 'Enter your license number' : null,
            ),
            const SizedBox(height: 12),
            FormField<DateTime>(
              validator: (_) => _expires == null ? 'Pick the expiry date' : null,
              builder: (field) => InputDecorator(
                decoration: InputDecoration(labelText: 'Expiry date', errorText: field.errorText),
                child: InkWell(
                  onTap: () async {
                    final d = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now().add(const Duration(days: 365)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365 * 10)),
                    );
                    if (d != null) setState(() => _expires = d);
                  },
                  child: Text(_expires == null ? 'Select' : DateFormat('d MMM yyyy').format(_expires!)),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text('Photo of your license', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            if (_photo != null)
              Stack(
                alignment: Alignment.center,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.memory(_photo!, height: 180, width: double.infinity, fit: BoxFit.cover),
                  ),
                  if (_uploading) const CircularProgressIndicator(),
                  if (_photoKey != null)
                    const Positioned(right: 8, top: 8, child: Chip(avatar: Icon(Icons.check_circle, color: Colors.green), label: Text('Uploaded'))),
                ],
              ),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _uploading ? null : () => _pickPhoto(ImageSource.camera),
                  icon: const Icon(Icons.photo_camera_outlined),
                  label: const Text('Take photo'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _uploading ? null : () => _pickPhoto(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library_outlined),
                  label: const Text('Choose'),
                ),
              ),
            ]),
            const SizedBox(height: 4),
            const Text('Stored privately; only our verification team can see it.', style: TextStyle(fontSize: 12)),
            const SizedBox(height: 24),
            FilledButton(onPressed: _busy || _uploading ? null : _submit, child: Text(_busy ? 'Submitting…' : 'Submit for verification')),
          ],
        ),
      ),
    );
  }
}
