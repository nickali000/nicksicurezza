def lcg_generate(m, a, c, seed, n=20):
    steps = []
    sequence = []
    
    current_x = seed
    
    steps.append({
        "step": "Inizio",
        "desc": f"Seme iniziale X₀ = {seed}. Parametri: m={m}, a={a}, c={c}."
    })
    
    sequence.append(current_x)
    
    for i in range(1, n + 1):
        prev_x = current_x
        # Formula: X_{n+1} = (a * X_n + c) % m
        term = a * prev_x + c
        current_x = term % m
        
        sequence.append(current_x)
        
        steps.append({
            "step": f"Iterazione {i} (X_{i})",
            "formula": f"({a} * {prev_x} + {c}) % {m}",
            "calc": f"{term} % {m}",
            "result": current_x
        })
        
        # Simple cycle detection (naive check if we hit seed again, though cycle might start later)
        if current_x == seed and i < n:
             steps.append({
                "step": "Ciclo Rilevato",
                "desc": f"Il valore X_{i} ({current_x}) è uguale al seme iniziale. La sequenza si ripeterà."
            })
            
    return {
        "sequence": sequence,
        "steps": steps,
        "period": "N/A (Analisi completa non eseguita)" # Placeholder
    }
