"""
Local stub for Emergent-only package 'emergentintegrations'.

Render cannot install 'emergentintegrations==0.1.0' from PyPI, so we provide this
placeholder so the backend can run independently of Emergent.

If any runtime path tries to use Emergent integrations, we fail loudly with a clear message.
"""

ENABLED = False

class EmergentIntegrationUnavailable(RuntimeError):
    pass

def __getattr__(name):
    raise EmergentIntegrationUnavailable(
        f"emergentintegrations.{name} was requested, but Emergent integrations are not available "
        f"in this deployment. Remove/replace the Emergent integration call or implement a real provider."
    )