import 'package:flutter/material.dart';
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
  final _doc = TextEditingController();
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
    _doc.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await context.read<Repository>().submitLicense(
            licenseNumber: _number.text.trim(),
            countryId: _countryId!,
            expiresAt: DateFormat('yyyy-MM-dd').format(_expires!),
            documentUrl: _doc.text.trim(),
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
            TextFormField(
              controller: _doc,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(
                labelText: 'License scan URL (optional)',
                helperText: 'Document upload comes in a later phase — paste a link for now.',
              ),
            ),
            const SizedBox(height: 24),
            FilledButton(onPressed: _busy ? null : _submit, child: Text(_busy ? 'Submitting…' : 'Submit for verification')),
          ],
        ),
      ),
    );
  }
}
