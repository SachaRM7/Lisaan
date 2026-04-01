import os
os.chdir("d:/Documents/Lisaan")
f=open("app/lesson/[id].tsx", encoding="utf-8")
c=f.read()
f.close()
# Find the formula line
idx = c.find("lesson.sort_order - ((moduleSortOrder")
if idx != -1:
    print("Found formula at:", idx)
    print("Replacing...")
    c = c.replace("lesson.sort_order - ((moduleSortOrder - 1) * 6)", "Math.max(1, lesson.sort_order - ((moduleSortOrder - 1) * 6))")
    f=open("app/lesson/[id].tsx", "w", encoding="utf-8")
    f.write(c)
    f.close()
    print("Done")
else:
    print("Formula not found")
