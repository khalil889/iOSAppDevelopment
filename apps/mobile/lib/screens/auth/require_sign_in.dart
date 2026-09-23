import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/session.dart';
import 'login_screen.dart';

/// Pushes the login screen if needed; resolves to true once signed in.
Future<bool> requireSignIn(BuildContext context) async {
  if (context.read<Session>().isSignedIn) return true;
  final ok = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const LoginScreen()));
  return ok == true;
}
