import os

path = r'c:\Users\Hendrik\Documents\GitHub\HandballTeam\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace progress bar
old_progress = 'id="timelineProgress" style="position: absolute; top: 0; left: 0; height: 100%; background: rgba(59, 130, 246, 0.1); border-right: 2px solid var(--primary); z-index: 1;"'
new_progress = 'id="timelineProgress" style="position: absolute; top: 50%; left: 0; height: 24px; background: #3b82f6; border-radius: 12px; transform: translateY(-50%); z-index: 1; min-width: 12px; box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);"'

if old_progress in content:
    content = content.replace(old_progress, new_progress)
    print("Updated Progress Bar")
else:
    # Try with slightly different spacing if it failed
    print("Could not find exact old_progress string")

# 2. Replace thin line
old_line = 'style="position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: rgba(255,255,255,0.15); transform: translateY(-50%);"'
new_line = 'style="position: absolute; top: 50%; left: 0; width: 100%; height: 24px; background: rgba(255,255,255,0.05); border-radius: 12px; transform: translateY(-50%); border: 1px solid rgba(255,255,255,0.1);"'

if old_line in content:
    content = content.replace(old_line, new_line)
    print("Updated Track Line")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
